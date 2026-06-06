import OpenAI from "openai";
import { evaluatePriorApproval, NIH_NOTICE } from "@/lib/decision";

export const runtime = "nodejs";

function getString(formData, key) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function extractPdfText(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return "";
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buffer);
  return parsed.text.slice(0, 24000);
}

async function extractBaselineWithModel({ text, manualBaseline }) {
  if (!text) {
    return {
      source: manualBaseline ? "manual" : "none",
      approvedSubrecipients: manualBaseline
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
      approvedBudgetNotes: "",
      confidence: manualBaseline ? "manual_entry" : "not_provided"
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Extract facts from an NIH Notice of Award or approved-budget text. Do not decide prior approval. Return strict JSON only."
      },
      {
        role: "user",
        content: `Extract approved subrecipients and any budget notes from this text. Return JSON with keys approvedSubrecipients, approvedBudgetNotes, confidence, caveats.\n\nManual baseline supplied by user, if any:\n${manualBaseline || "None"}\n\nPDF text:\n${text}`
      }
    ]
  });

  const raw = response.output_text || "{}";
  try {
    return { source: "pdf_llm_extraction", ...JSON.parse(raw) };
  } catch {
    return {
      source: "pdf_llm_extraction",
      approvedSubrecipients: [],
      approvedBudgetNotes: "",
      confidence: "low",
      caveats: ["Model output could not be parsed as JSON; review PDF manually."]
    };
  }
}

async function draftRequestWithModel({ form, decision, baseline }) {
  if (!decision.required) return "";

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Draft a concise NIH prior-approval request narrative. The deterministic rule engine has already decided whether prior approval is required. Do not contradict that determination. Use supplied field values when present. Use placeholders only for fields that are blank."
      },
      {
        role: "user",
        content: `Draft an eRA Commons Prior Approval Module "Other Request" for NOT-OD-26-062. Use the supplied grant number, PI, subrecipient, scope, and budget exactly when those fields are present. Use bracketed placeholders only for fields that are blank. Include: request subject, proposed subrecipient, scope, budget, reason the arrangement was not in the approved application, compliance statement, and requested NIH action.\n\nNotice: ${NIH_NOTICE.id}, effective ${NIH_NOTICE.effectiveDate}, path ${NIH_NOTICE.eraPath}\nDecision: ${JSON.stringify(decision)}\nBaseline extraction: ${JSON.stringify(baseline)}\nProposed change: ${JSON.stringify(form)}`
      }
    ]
  });

  return response.output_text || "";
}

function buildAuditTrail({ form, decision, baseline }) {
  return {
    timestamp: new Date().toISOString(),
    notice: NIH_NOTICE,
    inputs: form,
    baseline,
    rulePath: decision.route,
    facts: decision.facts,
    determination: decision.determination
  };
}

export async function POST(request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured for extraction and drafting." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const uploadedFile = formData.get("baselinePdf");
  const form = {
    grantNumber: getString(formData, "grantNumber"),
    piName: getString(formData, "piName"),
    manualBaseline: getString(formData, "manualBaseline"),
    subrecipientName: getString(formData, "subrecipientName"),
    scope: getString(formData, "scope"),
    budget: getString(formData, "budget"),
    appearedInApprovedApplication: getString(formData, "appearedInApprovedApplication"),
    domesticForeign: getString(formData, "domesticForeign"),
    isSubaward: getString(formData, "isSubaward"),
    isNewToProject: getString(formData, "isNewToProject")
  };

  const pdfText = await extractPdfText(uploadedFile);
  const baseline = await extractBaselineWithModel({
    text: pdfText,
    manualBaseline: form.manualBaseline
  });

  const decision = evaluatePriorApproval({
    isSubaward: form.isSubaward,
    isNewToProject: form.isNewToProject,
    notInApprovedApplication:
      form.appearedInApprovedApplication === "yes"
        ? false
        : form.appearedInApprovedApplication === "no"
          ? true
          : undefined,
    isDomestic:
      form.domesticForeign === "domestic"
        ? true
        : form.domesticForeign === "foreign"
          ? false
          : undefined
  });

  const draft = await draftRequestWithModel({ form, decision, baseline });
  const auditTrail = buildAuditTrail({ form, decision, baseline });

  return Response.json({ decision, draft, auditTrail });
}
