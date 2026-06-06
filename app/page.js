import Link from "next/link";
import { NIH_NOTICE } from "@/lib/decision";

export const metadata = {
  title: "NIH Subaward Prior-Approval Checker",
  description:
    "A rule-based tool for grants offices reviewing new domestic NIH subawards under NOT-OD-26-062."
};

export default function HomePage() {
  return (
    <main className="site-shell">
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

      <section className="home-hero">
        <div className="home-hero-copy">
          <h1>Know when a new NIH domestic subaward needs prior approval.</h1>
          <p>
            This tool helps a grants office apply the narrow rule in{" "}
            <a href={NIH_NOTICE.url}>{NIH_NOTICE.id}</a>: a new domestic subaward added
            post-award requires NIH prior approval when the arrangement was not part of
            the peer-reviewed and approved application.
          </p>
          <div className="hero-actions">
            <Link className="button-link" href="/checker">
              Run the checker
            </Link>
            <Link className="button-link secondary-link" href="/about">
              Read about the tool
            </Link>
          </div>
        </div>
        <aside className="home-proof" aria-label="Tool boundaries">
          <h2>Built for defensible review</h2>
          <dl>
            <div>
              <dt>Decision</dt>
              <dd>Deterministic rule engine</dd>
            </div>
            <div>
              <dt>AI use</dt>
              <dd>Extraction and drafting only</dd>
            </div>
            <div>
              <dt>Submission</dt>
              <dd>Grants officer reviews and submits</dd>
            </div>
            <div>
              <dt>Foreign subawards</dt>
              <dd>Routed out of scope to PF5/UF5</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="home-grid" aria-label="How it works">
        <article>
          <span>01</span>
          <h2>Enter the approved baseline.</h2>
          <p>
            Upload the Notice of Award or approved budget PDF, or manually enter
            approved subrecipients when the source document is not available.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Describe the proposed change.</h2>
          <p>
            The required facts are explicit: subaward, new to project, absent from
            the approved application, and domestic.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Review the determination.</h2>
          <p>
            The tool returns required, not required, or human review, plus the rule
            path, citation, draft request, and audit trail.
          </p>
        </article>
      </section>
    </main>
  );
}
