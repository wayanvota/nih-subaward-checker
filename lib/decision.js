export const DETERMINATIONS = {
  REQUIRED: "REQUIRED",
  NOT_REQUIRED: "NOT_REQUIRED",
  NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  OUT_OF_SCOPE_FOREIGN: "OUT_OF_SCOPE_FOREIGN"
};

export const NIH_NOTICE = {
  id: "NOT-OD-26-062",
  title: "Prior Approval Requirement for Changes to Domestic Subawards",
  url: "https://grants.nih.gov/grants/guide/notice-files/NOT-OD-26-062.html",
  effectiveDate: "2026-06-01",
  eraPath: "eRA Commons Prior Approval Module, Other Request"
};

const REQUIRED_FIELDS = [
  "isSubaward",
  "isNewToProject",
  "notInApprovedApplication",
  "isDomestic"
];

function isBoolean(value) {
  return value === true || value === false;
}

export function normalizeBoolean(value) {
  if (isBoolean(value)) return value;
  if (typeof value !== "string") return undefined;

  const clean = value.trim().toLowerCase();
  if (["true", "yes", "y", "1", "domestic"].includes(clean)) return true;
  if (["false", "no", "n", "0", "foreign"].includes(clean)) return false;
  return undefined;
}

export function evaluatePriorApproval(input) {
  const facts = {
    isSubaward: normalizeBoolean(input.isSubaward),
    isNewToProject: normalizeBoolean(input.isNewToProject),
    notInApprovedApplication: normalizeBoolean(input.notInApprovedApplication),
    isDomestic: normalizeBoolean(input.isDomestic)
  };

  const missing = REQUIRED_FIELDS.filter((field) => !isBoolean(facts[field]));
  if (missing.length > 0) {
    return {
      determination: DETERMINATIONS.NEEDS_HUMAN_REVIEW,
      required: false,
      route: "missing_or_ambiguous_input",
      citation: NIH_NOTICE,
      facts,
      missing,
      rationale:
        "The tool cannot make a defensible rule-based determination because one or more required inputs are missing or ambiguous."
    };
  }

  if (!facts.isDomestic) {
    return {
      determination: DETERMINATIONS.OUT_OF_SCOPE_FOREIGN,
      required: false,
      route: "foreign_subaward_pf5_uf5",
      citation: NIH_NOTICE,
      facts,
      missing: [],
      rationale:
        "Foreign subawards are outside this MVP. NIH states that foreign subawards are no longer recognized and that new international collaborations must use the PF5/UF5 structure."
    };
  }

  if (!facts.isSubaward) {
    return {
      determination: DETERMINATIONS.NOT_REQUIRED,
      required: false,
      route: "not_a_subaward",
      citation: NIH_NOTICE,
      facts,
      missing: [],
      rationale:
        "The proposed change is not a subaward, so this domestic subaward prior-approval trigger is not met."
    };
  }

  if (!facts.isNewToProject) {
    return {
      determination: DETERMINATIONS.NOT_REQUIRED,
      required: false,
      route: "existing_subrecipient",
      citation: NIH_NOTICE,
      facts,
      missing: [],
      rationale:
        "The proposed subrecipient is already part of the project, so the new domestic subaward trigger is not met."
    };
  }

  if (!facts.notInApprovedApplication) {
    return {
      determination: DETERMINATIONS.NOT_REQUIRED,
      required: false,
      route: "included_in_peer_reviewed_approved_application",
      citation: NIH_NOTICE,
      facts,
      missing: [],
      rationale:
        "The subaward arrangement was part of the peer-reviewed and approved application, so NOT-OD-26-062 does not require this post-award prior approval."
    };
  }

  // Notice reconciliation: NOT-OD-26-062 frames the trigger as "adding a new
  // domestic subaward ... post-award" that was not in the peer-reviewed approved
  // application. The secondary spec's four booleans encode that same trigger.
  return {
    determination: DETERMINATIONS.REQUIRED,
    required: true,
    route: "new_domestic_subaward_not_in_approved_application",
    citation: NIH_NOTICE,
    facts,
    missing: [],
    rationale:
      "NIH prior approval is required because the proposed change adds a new domestic subaward post-award and the arrangement was not part of the peer-reviewed and approved application."
  };
}
