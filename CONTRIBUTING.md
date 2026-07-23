# Contributing Guidelines

*Pull requests, bug reports, and all other forms of contribution are welcomed and highly encouraged!* :octocat:

### Contents

- [Code of Conduct](#books-code-of-conduct)
- [Asking Questions](#bulb-asking-questions)
- [Opening an Issue](#inbox_tray-opening-an-issue)
- [Feature Requests](#love_letter-feature-requests)
- [Triaging Issues](#mag-triaging-issues)
- [Submitting Pull Requests](#repeat-submitting-pull-requests)
- [Usage of AI in Contributions](#robot-usage-of-ai-in-contributions)
- [Writing Commit Messages](#memo-writing-commit-messages)
- [Code Review](#white_check_mark-code-review)
- [Coding Style](#nail_care-coding-style)
- [Certificate of Origin](#1st_place_medal-certificate-of-origin)
- [Credits](#pray-credits)

> **This guide serves to set clear expectations for everyone involved with the project so that we can improve it together while also creating a welcoming space for everyone to participate. Following these guidelines will help ensure a positive experience for contributors and maintainers.**

## :books: Code of Conduct

Please review our [Code of Conduct](https://github.com/payloadbay/.github/blob/master/CODE_OF_CONDUCT.md). It is in effect at all times. We expect it to be honored by everyone who contributes to Payload Bay. Harassment, abuse, and disrespectful behavior will not be tolerated.

## :bulb: Asking Questions

See our [Support Guide](https://github.com/payloadbay/.github/blob/master/SUPPORT.md). In short, GitHub issues should be reserved for actionable bug reports, feature requests, and planned work rather than support for a specific deployment.

## :inbox_tray: Opening an Issue

Before [creating an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue), check whether you are using the latest supported version of the project. If you are not up-to-date, see if updating fixes your issue first.

### :lock: Reporting Security Issues

Review our [Security Policy](https://github.com/payloadbay/.github/blob/master/SECURITY.md). **Do not** file a public issue for security vulnerabilities.

### :bug: Bug Reports and Other Issues

A great way to contribute to Payload Bay is to send a detailed issue when you encounter a problem. We always appreciate a well-written, thorough bug report. :+1:

In short, since you are most likely a developer or operator, **provide an issue that you would like to receive**.

- **Review the documentation and [Support Guide](https://github.com/payloadbay/.github/blob/master/SUPPORT.md)** before opening a new issue.
- **Do not open a duplicate issue.** Search through existing issues to see whether your problem has already been reported. If it has, add relevant information that is not already present.
- **Prefer using [reactions](https://github.blog/news-insights/product-news/add-reactions-to-pull-requests-issues-and-comments/)**, not comments, if you simply want to indicate that you are affected by an existing issue.
- **Fully complete the provided issue form.** Be clear, concise, and descriptive. Include the information needed to reproduce and investigate the problem, such as steps to reproduce, logs, relevant configuration, Payload Bay and dependency versions, operating-system details, deployment method, and screenshots where applicable.
- **Remove sensitive information.** Never include webhook secrets, API tokens, private payloads, credentials, or personal data in an issue.
- **Use [GitHub-flavored Markdown](https://docs.github.com/en/get-started/writing-on-github).** Put code, configuration, logs, and console output in fenced code blocks to keep the report readable.

## :love_letter: Feature Requests

Feature requests are welcome! While we will consider all requests, we cannot guarantee that a request will be accepted. Payload Bay has a deliberately focused product scope, and we want to avoid [feature creep](https://en.wikipedia.org/wiki/Feature_creep). An idea may be useful but still fall outside the project's goals.

If a request is accepted, that does not imply a commitment to a particular implementation or release date. You are welcome to help design or implement it after the direction has been agreed.

- **Do not open a duplicate feature request.** Search existing issues and discussions first. If you find the same or a closely related request, contribute there.
- **Fully complete the provided issue form.** It asks for the context needed to begin a productive conversation.
- **Describe the problem and desired outcome.** Explain who benefits and how the proposal relates to existing functionality.
- **Respect the project's non-goals.** Payload Bay is a webhook platform, not a general workflow builder, ETL platform, message broker, or arbitrary job runner.
- Include implementation ideas where they are useful, but keep the problem separate from a proposed technical solution.

## :mag: Triaging Issues

You can help triage issues by reproducing bug reports, confirming behavior on another environment, identifying duplicates, or asking for missing version and reproduction information. Focus on evidence and be respectful when a report turns out not to be a bug.

Any help that makes an issue easier to understand and resolve is appreciated.

## :repeat: Submitting Pull Requests

We **love** pull requests! Before [forking a repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and [creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) for non-trivial work, first open an issue or join the discussion on an existing issue. This avoids duplicated effort and gives maintainers and contributors a chance to agree on the intended outcome.

*Note: All contributions will be licensed under the license of the repository receiving the contribution.*

- **Follow the issue-first policy.** For non-trivial work, open or use an existing issue **before** coding. You do not need to wait for formal assignment, but you should wait for agreement on the direction when the change affects product behavior or architecture.
- **Complete the PR template.** Pull requests with a removed, empty, or materially incomplete template may be closed until the required information is provided.
- **Link the issue.** Use a closing keyword such as `Fixes #123` when the pull request fully resolves an issue.
- **Smaller is better.** Submit one focused pull request per bug fix, feature, or independently reviewable improvement. Do not combine unrelated refactoring or formatting with the intended change.
- **Coordinate bigger changes.** Discuss large, cross-repository, architectural, or breaking changes before implementation. Otherwise, you risk doing substantial work in a direction the project cannot accept.
- **Prioritize understanding over cleverness.** Write code clearly and concisely. Source code is read far more often than it is written. The purpose and logic should be understandable to a reasonably skilled contributor.
- **Follow existing coding style and conventions.** Use the repository's configured formatter, linter, type checker, and established patterns.
- **Include test coverage.** Add or update unit, integration, end-to-end, deployment, or security tests as appropriate to the behavior being changed.
- **Update examples and fixtures** when the repository contains them and the change affects their behavior.
- **Add documentation.** Update code documentation, user guides, API documentation, migration notes, or operational instructions when applicable.
- **Use the repository's default branch.** Unless explicitly documented otherwise, Payload Bay repositories use `master`.
- **Resolve merge conflicts** and promptly address CI failures.
- **Allow maintainer edits** to the pull-request branch when GitHub provides that option.
- **Review your own diff.** Remove debug output, generated noise, unrelated changes, secrets, and accidental formatting changes before requesting review.
- When writing comments, use complete and respectful sentences, including enough context for someone reading them later.

Payload Bay uses **squash merging** by default. The pull-request title becomes the final commit subject, so the title must follow the same Conventional Commit format as commit messages.

## :robot: Usage of AI in Contributions

We see AI as a tool to **speed up productivity**, **enhance creativity**, and **assist with repetitive tasks**, not as a substitute for understanding, verification, or responsibility.

Using AI to help write code, documentation, tests, issue reports, or review notes is welcome when it improves the contribution and is used responsibly. AI-assisted security research is also welcome through the private reporting process, but every claimed vulnerability must be manually verified before submission.

### ✅ Allowed if:

- The generated code or text is **thoroughly reviewed** by you before submission.
- You **understand and can explain** every AI-assisted part of the contribution.
- The contribution maintains or improves the project's **quality, security, and consistency**.
- AI is used to accelerate or enhance real work, not to bypass investigation or validation.
- You **disclose AI usage in the pull-request template**, including the tools used, the parts they materially influenced, and the human review performed.
- AI-assisted issues follow the relevant issue form and contain correct, project-specific information.
- AI-assisted security findings are reproduced or otherwise verified by you and are submitted privately according to the Security Policy.
- You check generated code and text for incorrect claims, insecure behavior, unsuitable dependencies, plagiarism, and license violations.

### ❌ Not allowed if:

- The pull request, issue, or security report contains **low-quality, irrelevant, fabricated, or untested content**.
- The contribution is **spammy, bulk-generated**, or submitted without meaningful human review.
- The contribution contains generic **AI slop**: shallow, low-signal output that lacks project-specific understanding.
- You submit content that you do not understand or cannot explain.
- AI is used to mass-submit speculative vulnerabilities, automated scanner output, or unrelated findings.
- The contribution introduces avoidable security risks, plagiarized material, or license violations.
- AI is used to impersonate another contributor or fabricate testing, review, or reproduction results.

### ⚠️ Responsibility Notice

When using AI for part or all of a contribution, **you remain fully responsible** for the result. AI-assisted work must meet the same standards as manually written work.

If you are uncertain about a generated approach, open an issue or draft pull request and explain what still needs validation. Do not present uncertain output as a finished solution.

Maintainers may close pull requests, issues, or security reports that breach these rules. Repeated or severe abuse may result in the contributor being blocked from further participation.

Examples include, but are not limited to:

- Submitting several low-quality AI-generated pull requests or issues without review.
- Copying or generating code whose licensing and provenance have not been checked.
- Submitting a large change that breaks existing behavior without meaningful testing.
- Claiming tests were executed when they were not.
- Reopening substantially identical AI-generated submissions to bypass review feedback.

## :memo: Writing Commit Messages

**Important:** Payload Bay uses automated commit-message validation. Commit messages and pull-request titles must follow [Conventional Commits](https://www.conventionalcommits.org/).

Clear commits keep history understandable and support automated changelogs, release notes, and squash merges. Gitmoji is not required.

### Commit Format

```text
type(scope): subject

Optional body explaining why the change was made.

Optional footer.
```

The scope is optional. Use it only when it adds useful context.

Breaking changes may use `!` before the colon and must explain the incompatibility in the body or a `BREAKING CHANGE:` footer:

```text
feat(api)!: remove deprecated delivery endpoint
```

### Rules for Commit Messages

1. **Use an allowed Conventional Commit type.**
1. **Write the type and optional scope in lowercase.**
1. **Use a concise, imperative subject.**
1. **Do not end the subject with a period.**
1. **Keep the complete header within 100 characters.**
1. **Separate the body from the subject with a blank line.**
1. **Use the body to explain motivation, context, and important trade-offs.**
1. **Reference issues or breaking changes in the footer when applicable.**

### Good Commit Examples

```text
feat(runner): add polling fallback

Keep runner deliveries available when the Realtime connection is interrupted.
```

```text
fix(ingress): preserve raw request bytes

Avoid reconstructing JSON before provider-signature verification.
```

```text
docs(self-hosting): explain trusted proxy configuration
```

```text
refactor(delivery): centralize retry classification
```

### Bad Commit Examples

```text
Update things                         # Missing type
feature: add runner                   # Unsupported type
feat Runner support                   # Missing colon
Feat(runner): Add support             # Type must be lowercase
feat(runner): added polling           # Use imperative mood
fix: handle timeout.                  # Do not end the subject with a period
WIP                                   # Does not describe the change
```

### Supported Commit Types

| Type | Description |
| --- | --- |
| `feat` | A new user-facing capability |
| `fix` | A bug fix |
| `docs` | Documentation-only changes |
| `refactor` | Code restructuring without an intended behavior change |
| `perf` | A performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build system, packaging, or dependency changes |
| `ci` | Continuous-integration configuration |
| `chore` | Maintenance that does not fit another type |
| `revert` | Reverting a previous change |

## :white_check_mark: Code Review

Your pull request will be reviewed before it is merged. Review is a collaborative process intended to improve correctness, maintainability, security, and shared understanding.

Maintainers may request changes or decide that a contribution does not fit the project's direction. Review may take time, especially for large or cross-cutting changes. Please be patient, respond to feedback, and ask when a request is unclear.

Approval and passing CI do not create an obligation to merge. Conversely, requested changes are about the contribution and should not be treated as a judgment of the contributor.

## :nail_care: Coding Style

Follow the existing style and conventions of the repository you are changing. Prefer the configured automated tools over manual formatting rules. Do not reformat unrelated files.

If a repository does not yet define a convention, match the surrounding code and raise broader style changes separately.

## :1st_place_medal: Certificate of Origin

By contributing to this project, you certify that:

```text
By contributing to this project, I certify that:

- I own the rights to my contribution or have the permission of the owner to submit it.
- I have read and understood the project's license and Code of Conduct.
- I am making my contribution under the project's license.
```

## :pray: Credits

Thanks for contributing! Thoughtful issues, testing, documentation, review, design work, and code all help make Payload Bay better. :heart:
