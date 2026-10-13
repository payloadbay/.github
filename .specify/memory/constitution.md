# Payload Bay Organization Tooling Constitution

## Core Principles

### I. Understandable, Scoped Changes

Explain what changes, why it helps and how it will be checked before substantial
work. Keep each change focused on one synchronization, policy or tooling outcome.
Use the existing issue-first process and repository baseline. Add automation only
when an agreed requirement needs it; product architecture stays in product repos.

### II. Explicit Ownership and Eligibility

Shared source lives here. Synchronization must touch only declared managed files
and explicitly eligible repositories. Project constitutions, specs, test profiles,
local state and unrelated configuration remain repository-owned. Preserve the
existing three-way merge and conflict-review behavior. Never infer enrollment
from dependencies or directory layout; review every addition to the eligible list.

### III. Meaningful Test-First Changes

For changed synchronization behavior, first reproduce the missing or incorrect
behavior in an executable test and observe its intended failure. Make the smallest
passing change, then refactor while relevant checks remain green. Use isolated
fixtures and temporary projects; production credentials or downstream repository
writes are not test fixtures. Prose-only changes need no artificial tests.

### IV. Fast Feedback and Complete Validation

Use the smallest relevant file or scenario during development. Run all affected
synchronizer tests, actual preset composition checks and applicable syntax/data
checks before completion. Scoped feedback cannot replace the final gate. Keep
each test's execution owner explicit and preserve required checks. If lanes are
introduced, require isolation and complete report inventory before aggregating.

### V. Honest Evidence and Navigation

Record verified commands and observed results without invented timing, coverage
or baseline claims. Explain gaps and unexpected failures. Reuse one test artifact
for several valid criteria rather than duplicating tests or reports. Query an
available Graphify graph for broad dependency discovery, verify its freshness and
source locations, and use `rg` for exact searches or missing/stale graph coverage.
Do not build a graph for every small change or treat graph edges as correctness
proof.

## Engineering Constraints

- Synchronization remains in the existing Node.js script and GitHub App workflow.
- SpecKit helper execution uses Python, with PyYAML in the selected interpreter.
  Use the verified platform interpreter; Windows does not require Bash helpers.
- Shared preset source and setup pins live under `.github/speckit/`. SpecKit owns
  local installation and generation. Synchronization does not execute agents or
  install tooling in downstream repositories.
- Never commit credentials, private payloads or virtual environments.
- Follow Conventional Commits, squash merging and the existing contribution rules.

## Development Workflow

1. Agree a concrete outcome in the required GitHub-first planning issue.
2. Inspect actual code, shared declarations and affected repository boundaries.
3. Write behavioral tests before implementing synchronization changes.
4. Use Red → Green → Refactor and retain the observed evidence.
5. Run the applicable final checks, including disposable Codex/Claude preset
   installation when shared SpecKit behavior changes.
6. Review the generated diff and submit a focused pull request.
7. Use Repository Baseline CI for distribution; verify its actual result before
   claiming downstream files arrived.

## Governance

This initial constitution applies the maintainer-approved shared preset to this
repository's existing architecture. Amendments require an explained proposal and
maintainer agreement. Use major versions for incompatible principles, minor for
new obligations and patch for clarifications. Every review checks compliance;
exceptions must state scope, reason and compensating evidence. A preset refresh
alone does not amend this constitution or authorize changes to project ownership.

**Version**: 1.0.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-13
