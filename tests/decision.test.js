import assert from "node:assert/strict";
import test from "node:test";
import { DETERMINATIONS, evaluatePriorApproval } from "../lib/decision.js";

test("new domestic subaward not in the approved application is required", () => {
  const result = evaluatePriorApproval({
    isSubaward: true,
    isNewToProject: true,
    notInApprovedApplication: true,
    isDomestic: true
  });

  assert.equal(result.determination, DETERMINATIONS.REQUIRED);
  assert.equal(result.required, true);
  assert.equal(result.route, "new_domestic_subaward_not_in_approved_application");
});

test("subaward included in approved application is not required", () => {
  const result = evaluatePriorApproval({
    isSubaward: true,
    isNewToProject: true,
    notInApprovedApplication: false,
    isDomestic: true
  });

  assert.equal(result.determination, DETERMINATIONS.NOT_REQUIRED);
  assert.equal(result.required, false);
  assert.equal(result.route, "included_in_peer_reviewed_approved_application");
});

test("foreign subaward routes out of MVP scope", () => {
  const result = evaluatePriorApproval({
    isSubaward: true,
    isNewToProject: true,
    notInApprovedApplication: true,
    isDomestic: false
  });

  assert.equal(result.determination, DETERMINATIONS.OUT_OF_SCOPE_FOREIGN);
  assert.equal(result.route, "foreign_subaward_pf5_uf5");
});

test("ambiguous or missing inputs need human review", () => {
  const result = evaluatePriorApproval({
    isSubaward: true,
    isNewToProject: "",
    notInApprovedApplication: true,
    isDomestic: true
  });

  assert.equal(result.determination, DETERMINATIONS.NEEDS_HUMAN_REVIEW);
  assert.deepEqual(result.missing, ["isNewToProject"]);
});
