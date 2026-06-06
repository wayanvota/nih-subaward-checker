import Link from "next/link";
import { NIH_NOTICE } from "@/lib/decision";

export const metadata = {
  title: "About | NIH Subaward Prior-Approval Checker",
  description:
    "About the NIH Subaward Prior-Approval Checker, its rule logic, AI boundary, and hosting model."
};

export default function AboutPage() {
  return (
    <main className="site-shell about-shell">
      <nav className="site-nav" aria-label="Primary">
        <Link className="site-mark" href="/">
          NIH Subaward Checker
        </Link>
        <div>
          <Link href="/checker">Checker</Link>
          <Link href="/about">About</Link>
          <a href={NIH_NOTICE.url}>NIH Notice</a>
        </div>
      </nav>

      <div className="about-layout">
        <article className="about-article">
          <p className="about-kicker">About</p>
          <h1>About the NIH Subaward Prior-Approval Checker</h1>

          <p>
            This is a narrow decision-support tool for NIH grants offices reviewing
            whether a proposed post-award subaward change requires prior approval
            under <a href={NIH_NOTICE.url}>{NIH_NOTICE.id}</a>.
          </p>

          <p>
            The rule is intentionally simple. Prior approval is required when the
            proposed change is a subaward, the subrecipient is new to the project,
            the arrangement was not part of the peer-reviewed and approved
            application, and the subaward is domestic. If any required input is
            missing or ambiguous, the tool routes the matter to human review.
          </p>

          <h2>What the tool does</h2>
          <p>
            The checker asks for the approved baseline and the proposed change. It
            returns a determination, a plain-language rationale, the rule path, the
            citation, and an audit trail. When prior approval is required, it drafts
            text for the eRA Commons Prior Approval Module using the Other Request
            type.
          </p>

          <h2>What the tool does not do</h2>
          <p>
            The checker does not submit anything to NIH. It does not decide foreign
            subaward rules. It does not make official NIH determinations. A grants
            officer must review the inputs, the source documents, the generated
            draft, and the final eRA Commons submission.
          </p>

          <h2>AI boundary</h2>
          <p>
            The model may extract approved subrecipients and budget notes from an
            uploaded PDF and may draft a justification narrative. The model never
            decides whether prior approval is required. That determination comes
            from a deterministic rule engine so the answer is reproducible.
          </p>

          <h2>Why this exists</h2>
          <p>
            The risk in this workflow is not that grants officers cannot read the
            notice. The risk is that mid-project changes happen under time pressure,
            with inconsistent source documents and uneven institutional memory. This
            tool makes the rule path visible enough to review, challenge, and save.
          </p>
        </article>

        <aside className="about-sidebar" aria-label="Reference links">
          <section>
            <h2>Use the Tool</h2>
            <Link className="button-link" href="/checker">
              Open checker
            </Link>
          </section>

          <section>
            <h2>Primary Source</h2>
            <p>
              <a href={NIH_NOTICE.url}>{NIH_NOTICE.id}</a>
            </p>
            <p>Effective date: {NIH_NOTICE.effectiveDate}</p>
            <p>Submission path: {NIH_NOTICE.eraPath}</p>
          </section>

          <section>
            <h2>Status</h2>
            <ul>
              <li>MVP</li>
              <li>Stateless</li>
              <li>No direct NIH submission</li>
              <li>No foreign-subaward determination</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
