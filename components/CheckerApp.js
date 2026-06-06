"use client";

import { useEffect, useMemo, useState } from "react";
import { NIH_NOTICE } from "@/lib/decision";

const initialForm = {
  grantNumber: "",
  piName: "",
  manualBaseline: "",
  subrecipientName: "",
  scope: "",
  budget: "",
  appearedInApprovedApplication: "",
  domesticForeign: "",
  isSubaward: "yes",
  isNewToProject: ""
};

function StatusBadge({ determination }) {
  const label = determination || "WAITING";
  return <span className={`status status-${label.toLowerCase()}`}>{label}</span>;
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function SelectField({ label, name, value, onChange, options, hint }) {
  return (
    <Field label={label} hint={hint}>
      <select name={name} value={value} onChange={onChange}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("nih-subaward-checker-form");
    if (saved) {
      try {
        setForm({ ...initialForm, ...JSON.parse(saved) });
      } catch {
        window.localStorage.removeItem("nih-subaward-checker-form");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nih-subaward-checker-form", JSON.stringify(form));
  }, [form]);

  const approvedApplicationText = useMemo(() => {
    if (form.appearedInApprovedApplication === "yes") return "The arrangement appeared in the approved application.";
    if (form.appearedInApprovedApplication === "no") return "The arrangement did not appear in the approved application.";
    return "Approved-application status has not been selected.";
  }, [form.appearedInApprovedApplication]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (file) body.append("baselinePdf", file);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        body
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The checker could not complete the review.");
      }
      setResult(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setFile(null);
    setResult(null);
    setError("");
    window.localStorage.removeItem("nih-subaward-checker-form");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>NIH Subaward Prior-Approval Checker</h1>
          <p>
            Rule-based decision support for NOT-OD-26-062. A grants officer reviews the draft and submits in eRA Commons. This tool is not an official NIH determination.
          </p>
        </div>
        <a href={NIH_NOTICE.url} target="_blank" rel="noreferrer">
          {NIH_NOTICE.id}
        </a>
      </header>

      <section className="notice-strip">
        <strong>Verified trigger:</strong> Effective {NIH_NOTICE.effectiveDate}, NIH prior approval is required when a prime recipient adds a new domestic subaward post-award and the arrangement was not part of the peer-reviewed and approved application. Submit through {NIH_NOTICE.eraPath}.
      </section>

      <form className="workspace" onSubmit={submit}>
        <section className="panel input-panel">
          <div className="panel-heading">
            <h2>Approved Baseline</h2>
            <p>Upload a Notice of Award or approved-budget PDF, or enter approved subrecipients manually.</p>
          </div>

          <Field label="Baseline PDF">
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </Field>

          <Field label="Approved subrecipients, manual fallback" hint="One per line or comma-separated. Used directly if no PDF is uploaded.">
            <textarea
              name="manualBaseline"
              value={form.manualBaseline}
              onChange={updateForm}
              rows={4}
              placeholder="Example University&#10;Regional Medical Center"
            />
          </Field>

          <div className="two-col">
            <Field label="Grant number">
              <input name="grantNumber" value={form.grantNumber} onChange={updateForm} placeholder="[Grant #]" />
            </Field>
            <Field label="PI">
              <input name="piName" value={form.piName} onChange={updateForm} placeholder="[PI name]" />
            </Field>
          </div>

          <div className="panel-heading proposed">
            <h2>Proposed Change</h2>
            <p>Unknowns route to human review. The app never fills silent defaults.</p>
          </div>

          <Field label="New subrecipient name">
            <input name="subrecipientName" value={form.subrecipientName} onChange={updateForm} placeholder="Institution or organization" />
          </Field>

          <div className="two-col">
            <SelectField
              label="Domestic or foreign"
              name="domesticForeign"
              value={form.domesticForeign}
              onChange={updateForm}
              options={[
                { value: "domestic", label: "Domestic" },
                { value: "foreign", label: "Foreign" }
              ]}
            />
            <SelectField
              label="Subaward?"
              name="isSubaward"
              value={form.isSubaward}
              onChange={updateForm}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" }
              ]}
            />
          </div>

          <div className="two-col">
            <SelectField
              label="New to project?"
              name="isNewToProject"
              value={form.isNewToProject}
              onChange={updateForm}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" }
              ]}
            />
            <SelectField
              label="Appeared in approved application?"
              name="appearedInApprovedApplication"
              value={form.appearedInApprovedApplication}
              onChange={updateForm}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" }
              ]}
              hint={approvedApplicationText}
            />
          </div>

          <Field label="Scope">
            <textarea name="scope" value={form.scope} onChange={updateForm} rows={4} placeholder="Work the subrecipient will perform" />
          </Field>

          <Field label="Budget">
            <textarea name="budget" value={form.budget} onChange={updateForm} rows={3} placeholder="Total cost, direct cost, budget period, or placeholders" />
          </Field>

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Run Check"}
            </button>
            <button type="button" className="secondary" onClick={resetForm}>
              Reset
            </button>
          </div>
        </section>

        <section className="panel output-panel" aria-live="polite">
          <div className="panel-heading result-heading">
            <div>
              <h2>Determination</h2>
              <p>Deterministic rule path, citation, draft, and audit trail.</p>
            </div>
            <StatusBadge determination={result?.decision?.determination} />
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          {!result && !error ? (
            <div className="empty-state">
              Complete the proposed-change fields and run the check. Missing or ambiguous inputs will route to human review.
            </div>
          ) : null}

          {result ? (
            <>
              <article className="decision-card">
                <h3>Plain-language rationale</h3>
                <p>{result.decision.rationale}</p>
                <p className="citation">
                  Citation: <a href={NIH_NOTICE.url} target="_blank" rel="noreferrer">{NIH_NOTICE.id}</a>, effective {NIH_NOTICE.effectiveDate}. Submission path: {NIH_NOTICE.eraPath}.
                </p>
              </article>

              {result.decision.determination === "OUT_OF_SCOPE_FOREIGN" ? (
                <article className="foreign-card">
                  <h3>Foreign-subaward route</h3>
                  <p>Stop this MVP workflow. Route the matter to the NIH-funded international collaboration structure, PF5/UF5. Do not infer foreign-subaward rules from this checker.</p>
                </article>
              ) : null}

              <article className="decision-card">
                <h3>Rule path</h3>
                <dl className="facts">
                  <div><dt>Route</dt><dd>{result.decision.route}</dd></div>
                  <div><dt>Subaward</dt><dd>{String(result.decision.facts.isSubaward)}</dd></div>
                  <div><dt>New to project</dt><dd>{String(result.decision.facts.isNewToProject)}</dd></div>
                  <div><dt>Not in approved app</dt><dd>{String(result.decision.facts.notInApprovedApplication)}</dd></div>
                  <div><dt>Domestic</dt><dd>{String(result.decision.facts.isDomestic)}</dd></div>
                </dl>
              </article>

              {result.draft ? (
                <article className="draft-card">
                  <h3>Draft eRA Commons Other Request</h3>
                  <textarea readOnly value={result.draft} rows={14} />
                </article>
              ) : (
                <article className="draft-card muted">
                  <h3>Draft request</h3>
                  <p>No eRA Commons Other Request draft is generated unless the rule engine returns REQUIRED.</p>
                </article>
              )}

              <article className="audit-card">
                <h3>Audit trail</h3>
                <pre>{JSON.stringify(result.auditTrail, null, 2)}</pre>
              </article>
            </>
          ) : null}
        </section>
      </form>
    </main>
  );
}
