import { expect, test } from "@playwright/test";

const requiredFields = {
  grantNumber: "R01AI123456",
  piName: "Wayan Vota",
  manualBaseline: "Existing University",
  subrecipientName: "Example University",
  scope: "Community health implementation research",
  budget: "$90,000 total cost"
};

async function completeRequiredForm(page, overrides = {}) {
  for (const [name, value] of Object.entries(requiredFields)) {
    await page.locator(`[name="${name}"]`).fill(overrides[name] ?? value);
  }
  await page.locator('[name="domesticForeign"]').selectOption(overrides.domesticForeign || "domestic");
  await page.locator('[name="isSubaward"]').selectOption(overrides.isSubaward || "yes");
  await page.locator('[name="isNewToProject"]').selectOption(overrides.isNewToProject || "yes");
  await page.locator('[name="appearedInApprovedApplication"]').selectOption(overrides.appearedInApprovedApplication || "no");
}

async function runCheck(page) {
  await page.getByRole("button", { name: "Run Check" }).click();
  await expect(page.locator(".status")).not.toHaveText("WAITING", { timeout: 15_000 });
}

function multipart(overrides = {}) {
  return {
    grantNumber: requiredFields.grantNumber,
    piName: requiredFields.piName,
    manualBaseline: requiredFields.manualBaseline,
    subrecipientName: requiredFields.subrecipientName,
    scope: requiredFields.scope,
    budget: requiredFields.budget,
    domesticForeign: "domestic",
    isSubaward: "yes",
    isNewToProject: "yes",
    appearedInApprovedApplication: "no",
    ...overrides
  };
}

test("U01 home page states the decision and AI boundaries", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Know when a new NIH domestic subaward/ })).toBeVisible();
  await expect(page.getByText("Deterministic rule engine")).toBeVisible();
  await expect(page.getByText("Extraction and drafting only")).toBeVisible();
});

test("U02 a user can reach the checker from the home page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Run the checker" }).click();
  await expect(page).toHaveURL(/\/checker$/);
  await expect(page.getByRole("heading", { name: "NIH Subaward Prior-Approval Checker" })).toBeVisible();
});

test("U03 the full required path creates a cited draft and audit trail", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page);
  await runCheck(page);
  await expect(page.locator(".status")).toHaveText("REQUIRED");
  await expect(page.locator(".draft-card textarea")).toContainText(requiredFields.grantNumber);
  await expect(page.locator(".draft-card textarea")).toContainText(requiredFields.subrecipientName);
  await expect(page.locator(".audit-card")).toContainText("new_domestic_subaward_not_in_approved_application");
  await expect(page.getByRole("link", { name: "NOT-OD-26-062" }).last()).toHaveAttribute("href", /^https:\/\/grants\.nih\.gov\//);
});

test("U04 an approved arrangement is not required and creates no draft", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { appearedInApprovedApplication: "yes" });
  await runCheck(page);
  await expect(page.locator(".status")).toHaveText("NOT_REQUIRED");
  await expect(page.locator(".draft-card")).toContainText("No eRA Commons Other Request draft");
});

test("U05 an existing subrecipient is not required", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { isNewToProject: "no" });
  await runCheck(page);
  await expect(page.locator(".status")).toHaveText("NOT_REQUIRED");
  await expect(page.locator(".facts")).toContainText("existing_subrecipient");
});

test("U06 a non-subaward follows the not-a-subaward route", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { isSubaward: "no" });
  await runCheck(page);
  await expect(page.locator(".status")).toHaveText("NOT_REQUIRED");
  await expect(page.locator(".facts")).toContainText("not_a_subaward");
});

test("U07 a foreign arrangement stops at the PF5/UF5 route", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { domesticForeign: "foreign" });
  await runCheck(page);
  await expect(page.locator(".status")).toHaveText("OUT_OF_SCOPE_FOREIGN");
  await expect(page.locator(".foreign-card")).toContainText("PF5/UF5");
});

test("U08 missing facts route to human review without a draft", async ({ page }) => {
  await page.goto("/checker");
  await runCheck(page);
  await expect(page.locator(".status")).toHaveText("NEEDS_HUMAN_REVIEW");
  await expect(page.locator(".draft-card")).toContainText("No eRA Commons Other Request draft");
});

test("U09 form values survive a browser reload", async ({ page }) => {
  await page.goto("/checker");
  await page.locator('[name="grantNumber"]').fill(requiredFields.grantNumber);
  await page.locator('[name="subrecipientName"]').fill(requiredFields.subrecipientName);
  await page.reload();
  await expect(page.locator('[name="grantNumber"]')).toHaveValue(requiredFields.grantNumber);
  await expect(page.locator('[name="subrecipientName"]')).toHaveValue(requiredFields.subrecipientName);
});

test("U10 reset clears saved inputs and the determination", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { appearedInApprovedApplication: "yes" });
  await runCheck(page);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator('[name="grantNumber"]')).toHaveValue("");
  await expect(page.locator(".status")).toHaveText("WAITING");
  await page.reload();
  await expect(page.locator('[name="grantNumber"]')).toHaveValue("");
});

test("A01 a non-form request receives a bounded client error", async ({ request }) => {
  const response = await request.post("/api/check", { data: { unexpected: true } });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toMatch(/form data/i);
});

test("A02 an oversized submission is rejected before evaluation", async ({ request }) => {
  const response = await request.post("/api/check", { multipart: multipart({ scope: "x".repeat(2 * 1024 * 1024) }) });
  expect(response.status()).toBe(413);
});

test("A03 a non-PDF upload is rejected as user input", async ({ request }) => {
  const response = await request.post("/api/check", { multipart: multipart({
    baselinePdf: { name: "baseline.txt", mimeType: "text/plain", buffer: Buffer.from("not a PDF") }
  }) });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toContain("must be a PDF");
});

test("A04 a non-required decision bypasses a failing drafting service", async ({ request }) => {
  const response = await request.post("/api/check", { multipart: multipart({
    isSubaward: "no",
    scope: "FIXTURE_UPSTREAM_FAILURE"
  }) });
  expect(response.status()).toBe(200);
  expect((await response.json()).decision.determination).toBe("NOT_REQUIRED");
});

test("A05 contradictory model text cannot change the deterministic decision", async ({ request }) => {
  const response = await request.post("/api/check", { multipart: multipart({ scope: "FIXTURE_CONTRADICTION" }) });
  const body = await response.json();
  expect(body.decision.determination).toBe("REQUIRED");
  expect(body.draft).toContain("NOT REQUIRED");
});

test("A06 active HTML in a draft remains inert", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { scope: "<img src=x onerror=window.__pwned=true>" });
  await runCheck(page);
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  await expect(page.locator("img[src='x']")).toHaveCount(0);
  await expect(page.locator(".draft-card textarea")).toContainText("<img src=x");
});

test("A07 provider failure leaves a bounded manual-rule message", async ({ page }) => {
  await page.goto("/checker");
  await completeRequiredForm(page, { scope: "FIXTURE_UPSTREAM_FAILURE" });
  await page.getByRole("button", { name: "Run Check" }).click();
  await expect(page.locator(".error-box")).toContainText("Apply the cited rule manually");
  await expect(page.getByRole("button", { name: "Run Check" })).toBeEnabled();
});

test("A08 unknown routes and unsupported methods fail closed", async ({ request }) => {
  const [unknown, method] = await Promise.all([
    request.get("/api/not-a-route"),
    request.put("/api/check", { data: {} })
  ]);
  expect(unknown.status()).toBe(404);
  expect(method.status()).toBe(405);
});

test("A09 unexpected choice values route to human review", async ({ request }) => {
  const response = await request.post("/api/check", { multipart: multipart({
    domesticForeign: "moon",
    isNewToProject: "perhaps",
    appearedInApprovedApplication: "unknown"
  }) });
  const body = await response.json();
  expect(response.status()).toBe(200);
  expect(body.decision.determination).toBe("NEEDS_HUMAN_REVIEW");
  expect(body.draft).toBe("");
});

test("A10 failures omit credentials and carry defensive headers", async ({ request }) => {
  const response = await request.post("/api/check", { multipart: multipart({ scope: "FIXTURE_UPSTREAM_FAILURE" }) });
  const body = await response.text();
  expect(response.status()).toBe(502);
  expect(body).not.toMatch(/OPENAI_API_KEY|e2e-fixture-key|authorization|node_modules|fixture upstream/);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});
