# :shield: Security Policy

## :bookmark_tabs: Supported Versions

Payload Bay is currently in early development and has not published a stable
release line.

Until a repository publishes a more specific support policy, security fixes
target:

- The latest release or pre-release of the affected repository
- The current default branch (`master`)

Older commits, development snapshots, and superseded pre-releases may not receive
separate security updates. Once stable release lines exist, this section will be
replaced with an explicit version support table.

## :lock: Reporting a Vulnerability

If you discover a security vulnerability in Payload Bay, please report it
privately. We take security reports seriously and will investigate reproducible,
in-scope findings.

**Do not open a public issue, discussion, or pull request for an undisclosed
vulnerability.**

### :mailbox_with_mail: How to Report

1. **Identify the affected repository**

   Report the vulnerability in the Payload Bay repository containing the
   affected component.

2. **Use GitHub Private Vulnerability Reporting**

   Open the repository's **Security** tab, select **Advisories**, and choose
   **Report a vulnerability**.

   If private vulnerability reporting is not available for the affected
   repository, contact [mail@thedannicraft.de](mailto:mail@thedannicraft.de)
   instead.

3. **Include enough detail to investigate**

   A useful report should include:

   - The affected repository, component, version, tag, or commit
   - The deployment assumptions and configuration required for exploitation
   - Clear steps to reproduce the vulnerability
   - A minimal proof of concept where practical
   - The observed and expected behavior
   - The potential impact and realistic attack scenario
   - Any known mitigations, workarounds, or suggested fixes
   - Sanitized logs, requests, payloads, screenshots, or traces where useful

Do not include credentials, active tokens, unrelated personal data, or payloads
belonging to another person or organization. Redact secrets that are not
essential to reproducing the issue.

## :robot: Use of AI in Security Reports

We allow the responsible use of AI tools to assist with security research and
report writing. AI may help analyze code, organize evidence, or explain a
manually verified finding.

AI output is not evidence by itself. Every reported vulnerability must be
manually verified before submission, and the reporter remains responsible for
the report's accuracy, safety, and relevance.

### ✅ Allowed if:

- AI assists with analysis, reproduction, report structure, or clarity.
- You manually verify that the vulnerability exists.
- You can reproduce the finding or provide equivalent concrete evidence.
- You understand the affected code path and realistic security impact.
- You review and confirm every AI-generated technical claim.
- You disclose material AI assistance in the private report.
- The report follows this policy and contains the information needed to
  investigate it.

### ❌ Not allowed if:

- The report is generated or submitted automatically without human review.
- The reported behavior has not been reproduced or otherwise verified.
- The report contains fabricated code paths, versions, impacts, or evidence.
- You mass-submit speculative, duplicate, or low-quality findings.
- You copy findings from unrelated projects without validating them against
  Payload Bay.
- You use AI to probe an installation or data that you are not authorized to
  test.
- You attempt to game a disclosure, bounty, credit, or reputation system.

### ⚠️ Responsibility and Enforcement

You are fully responsible for every AI-assisted security report you submit.
Reports that consist of unverified model or scanner output may be closed without
further investigation.

Repeated spam, fabricated findings, unauthorized testing, or deliberate misuse
of the reporting process may result in the reporter being blocked from further
participation.

Examples include, but are not limited to:

- Submitting several unverified reports generated from the same generic prompt
- Claiming exploitability without demonstrating a reachable attack path
- Reporting dependencies or code that Payload Bay does not use
- Rephrasing an existing public issue as a new vulnerability
- Providing generated proof-of-concept code that was never executed or reviewed

## :hourglass_flowing_sand: Response Process

After receiving a report, we aim to:

- Acknowledge receipt within 48 hours
- Provide an initial assessment within 5 business days
- Confirm whether the report is accepted, rejected, duplicated, or requires more
  information
- Coordinate remediation and disclosure with the reporter when appropriate
- Keep the reporter informed of material changes in status

We aim to provide a fix within 30 days when practical. The actual timeline
depends on severity, exploitability, affected releases, required architectural
changes, and maintainer availability.

> [!NOTE]
> These timelines are best-effort targets, not a service-level agreement.
> Enterprise support agreements may define separate response commitments.

Please allow a reasonable amount of time for investigation before requesting an
update. Respond promptly when additional reproduction details are requested.

## :mega: Public Disclosure

Please do not disclose the vulnerability publicly before a coordinated
resolution or agreed disclosure date.

When appropriate, we will:

- Publish a GitHub Security Advisory
- Release corrected versions or mitigation instructions
- Describe affected versions and upgrade requirements
- Request a CVE when the issue qualifies
- Credit the reporter if they want to be named

Some reports may be resolved without a public advisory when they do not
represent a security vulnerability, affect unreleased code only, duplicate an
existing report, or would reveal sensitive information without improving user
safety.

## :toolbox: Security Practices

Payload Bay repositories should use security controls appropriate to their
contents, including:

- Full commit SHA pinning for third-party GitHub Actions
- Automated dependency and vulnerability alerts
- Secret scanning and push protection where available
- Code scanning appropriate to the language and repository
- Review and CI checks before changes are merged
- Private vulnerability reporting
- Signed release artifacts, checksums, and software bills of materials where
  applicable

Individual repositories may document additional controls, threat models, or
hardening requirements. The presence of a tool does not replace manual review,
reproduction, or responsible disclosure.

## :books: Resources

- [GitHub documentation for privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/privately-reporting-a-security-vulnerability)
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OpenSSF Best Practices](https://www.bestpractices.dev/)

For questions about this policy or problems accessing private vulnerability
reporting, contact [mail@thedannicraft.de](mailto:mail@thedannicraft.de).

Thank you for helping keep Payload Bay and its users secure! :heart:
