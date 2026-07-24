# Support and Help

Need help installing, configuring, or using Payload Bay? Here's how to get an
answer without turning the issue tracker into a support queue.

## How to Get Help

GitHub Issues are primarily used for confirmed bugs, actionable feature
requests, and planned work. Questions about a particular installation,
deployment, integration, or application belong in the public support channels
of the affected repository.

Please seek support in the following order:

1. 📚 **Read the documentation and repository guides.**

   Start with the affected repository's `README.md`, documentation, examples,
   release notes, and troubleshooting guides. Confirm that the instructions
   match the version you are running.

2. 🔎 **Search existing discussions and issues.**

   Someone may already have asked the same question or reported the same
   behavior. Searching first avoids duplicate work and may provide an immediate
   solution.

3. 💬 **Ask in the affected repository's GitHub Discussions.**

   Open the **Discussions** tab in the Payload Bay repository containing the
   component you need help with. Choose the most appropriate question or support
   category available there.

   A useful support request includes:

   - What you are trying to accomplish
   - The Payload Bay repository and version or commit involved
   - Your deployment method and relevant environment details
   - The documentation or troubleshooting steps you already followed
   - The expected and observed behavior
   - A minimal configuration or reproduction where practical
   - Sanitized logs, errors, screenshots, or traces

4. 🐛 **Open an issue only when the result is actionable project work.**

   Use the repository's issue forms for a reproducible bug, a concrete
   documentation problem, or a feature request. Fully complete the form and link
   any related discussion.

Public questions receive public answers, allowing other users to find and
improve them later.

## Before Sharing Logs or Configuration

Payload Bay processes webhook payloads, provider signatures, target
credentials, and other potentially sensitive information.

Before posting anything publicly, remove:

- API tokens, runner credentials, passwords, and signing secrets
- Authorization, cookie, and provider-signature headers
- Private webhook payloads and personal data
- Internal hostnames, IP addresses, and customer identifiers where sensitive
- Database connection strings and service-role keys
- Any other credential or value that could grant access to an installation

Use placeholders consistently so that the remaining configuration is still
understandable. If a secret was posted accidentally, revoke or rotate it
immediately; editing the public post is not sufficient.

## What Not to Do

Please **do not**:

1. ❌ Contact maintainers or contributors through personal social-media
   accounts, private messages, or unrelated repositories for support.

2. ❌ Email maintainers for general Community support. Email is reserved for the
   fallback security-reporting path described in the
   [Security Policy](https://github.com/payloadbay/.github/blob/master/SECURITY.md)
   and for support provided under a separate Enterprise agreement.

3. ❌ Open duplicate issues or add comments that only say `+1`. Use GitHub
   reactions when you want to indicate that an existing issue also affects you.

4. ❌ Cross-post the same question across several Payload Bay repositories.
   Choose the repository that owns the affected component and link related
   context when necessary.

5. ❌ Attach an entire private project and ask contributors to debug it for you.
   Create the smallest safe reproduction that demonstrates the problem.

6. ❌ Publish suspected security vulnerabilities. Follow the private process in
   the [Security Policy](https://github.com/payloadbay/.github/blob/master/SECURITY.md).

7. ❌ Include secrets, private payloads, or personal data in a discussion or
   issue.

These boundaries keep support searchable, protect sensitive information, and
allow maintainers and contributors to focus on improving Payload Bay for
everyone. ✌️
