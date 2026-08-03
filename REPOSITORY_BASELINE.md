# Repository baseline

The public [`payloadbay/.github`](https://github.com/payloadbay/.github)
repository defines the settings and files shared by Payload Bay repositories.
Repository-specific configuration remains in the repository that uses it.

## Managed configuration

The baseline synchronizer manages these shared configuration categories:

- paths listed in [`.github/repository-baseline.json`](.github/repository-baseline.json);
- labels declared in [`.github/labels.json`](.github/labels.json);
- selected merge settings read from the live `.github` repository settings;
- repository rulesets whose names start with `baseline:`;
- repository autolinks in the prefixes reserved by the baseline manifest.

Files outside the managed path list are not copied, changed, or deleted. A
repository can therefore add its own Issue Forms, workflows, labels, and
rulesets. Repository-specific rulesets must not use the reserved `baseline:`
prefix.

## Repository profiles

Profiles extend the baseline only for repositories explicitly listed in the
central manifest. They are never inferred from a repository's file types or
language percentage.

The initial `typescript` profile manages its quality workflow, editor settings,
Fallow configuration, and `baseline:typescript-quality` ruleset. Before the
profile is synchronized, the repository must already have the declared Bun
package manager, quality scripts, development dependencies, and a regenerated
lockfile. Use the central **Repository Profile Bootstrap** workflow to create
that focused pull request. It semantically merges only missing profile package
entries, refuses conflicts with repository-owned entries, and runs
`bun install --lockfile-only --ignore-scripts` before opening the PR. Enroll a
repository only after that bootstrap PR is merged; the normal baseline sync then
applies the remaining managed files and required ruleset.

`AGENTS.md` is a managed root-level baseline for coding agents. Repositories
extend it through an optional root-level `AGENTS.local.md`, which remains local
and is never synchronized or overwritten.

Community health files such as `CONTRIBUTING.md`, `SUPPORT.md`, `SECURITY.md`,
and the organization profile live in this repository as GitHub's organization
defaults. They apply when a public repository does not provide its own file and
are intentionally not force-synchronized over repository-specific guidance.

Common files are merged against the last version applied to each repository.
The synchronizer commits a clean merge directly to the default branch. If both
the common file and its repository copy contain conflicting edits, it creates
or updates `automation/repository-baseline` and opens a pull request for manual
resolution.

## Planned work and Linear

The maintainer-only Planned Work form exposes approved implementation work when
it is useful to track that work publicly. Create the GitHub issue first. GitHub
Issues Sync then creates the canonical Linear issue and posts its `PAB-`
identifier as a linkback comment. Enrich that synchronized issue with its
project, milestone, labels, assignee, and genuine dependencies; do not create a
second Linear issue for the same work.

Pull requests close the public issue with `Fixes #123`. Contributors do not
need to know or repeat the synchronized Linear identifier. The Linear bot's
linkback comment on the GitHub issue provides the public cross-reference. The
baseline also configures the `PAB-` autolink in every managed repository, so
maintainer references remain clickable where they are useful. Submissions from
users without repository collaboration access are closed automatically as not
planned.

## Pull request quality

The shared pull request quality baseline includes:

- the pull request template and metadata labeler;
- Conventional Commit validation for pull request titles and commits;
- branch-name validation;
- Anti-Slop checks for contribution quality and automated abuse.

The `Branch Name`, `Conventional Commits`, and `Conventional PR Title` checks
run with read-only repository access. Anti-Slop runs from the trusted default
branch through `pull_request_target`, does not check out contributor code, and
may label, comment on, or close a pull request that reaches the configured
failure threshold.

The synchronized files are declared in
[`.github/repository-baseline.json`](.github/repository-baseline.json). The
`baseline:default-branch` ruleset requires `Anti-Slop`, `Branch Name`,
`Conventional Commits`, and `Conventional PR Title` before merge.
Organization administrators have an explicit bypass for recovery and baseline
maintenance.

## Renovate

[`renovate-config.json`](renovate-config.json) is a shared Renovate preset, not
a file copied into every repository. When a repository has no Renovate
configuration, its first baseline synchronization creates a small
`renovate.json` that extends:

```text
local>payloadbay/.github:renovate-config
```

That local file then belongs to the repository and may contain additional
rules. Later baseline runs only report when an existing configuration no
longer references the shared preset.

## GitHub App

Cross-repository synchronization uses a private GitHub App instead of a
personal access token. Install it for every Payload Bay repository with these
repository permissions:

| Permission     | Access         |
| -------------- | -------------- |
| Administration | Read and write |
| Contents       | Read and write |
| Issues         | Read and write |
| Metadata       | Read           |
| Pull requests  | Read and write |
| Workflows      | Read and write |

Add the App ID as the `.github` repository variable
`PAYLOADBAY_BASELINE_APP_ID`. Add its private key as the `.github` repository
secret `PAYLOADBAY_BASELINE_APP_PRIVATE_KEY`. No other repository needs direct
access to either value.

The workflow remains validation-only until the App ID variable exists.

## Rulesets and merge settings

Configure shared merge behavior on the `.github` repository. The synchronizer
copies only the allow/deny merge methods, squash format, default branch,
automatic branch deletion, auto-merge, and update-branch settings.

Create shared rulesets on `.github` with the `baseline:` prefix. The initial
ruleset is `baseline:default-branch`. Rulesets with that prefix are created,
updated, and removed in target repositories to match `.github`. Other rulesets
remain local.

The synchronization App is added as a bypass actor only in target
repositories. It does not bypass the rules protecting the `.github` source
repository.

Autolink prefixes listed in `managedAutolinkPrefixes` are reserved for the
baseline. Matching autolinks are created, corrected, or removed to match the
manifest. Autolinks with any other prefix remain repository-specific.

## Running the workflow

The **Repository Baseline** workflow supports:

- a read-only dry-run across the organization;
- synchronization of one named repository;
- synchronization of every active repository;
- daily drift reconciliation.

Forks, archived repositories, and names listed in `excludedRepositories` are
not synchronized. Runs are serialized so that two baseline updates cannot
write to the same repository concurrently.
