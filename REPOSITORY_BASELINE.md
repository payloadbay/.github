# Repository baseline

The public [`payloadbay/.github`](https://github.com/payloadbay/.github)
repository defines the settings and files shared by Payload Bay repositories.
Repository-specific configuration remains in the repository that uses it.

## Managed configuration

The baseline synchronizer manages four kinds of configuration:

- paths listed in [`.github/repository-baseline.json`](.github/repository-baseline.json);
- labels declared in [`.github/labels.json`](.github/labels.json);
- selected merge settings read from the live `.github` repository settings;
- repository rulesets whose names start with `baseline:`.

Files outside the managed path list are not copied, changed, or deleted. A
repository can therefore add its own Issue Forms, workflows, labels, and
rulesets. Repository-specific rulesets must not use the reserved `baseline:`
prefix.

Common files are merged against the last version applied to each repository.
The synchronizer commits a clean merge directly to the default branch. If both
the common file and its repository copy contain conflicting edits, it creates
or updates `automation/repository-baseline` and opens a pull request for manual
resolution.

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

Add the App ID as the organization variable
`PAYLOADBAY_BASELINE_APP_ID`. Add its private key as the organization secret
`PAYLOADBAY_BASELINE_APP_PRIVATE_KEY`, with access limited to the `.github`
repository.

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

## Running the workflow

The **Repository Baseline** workflow supports:

- a read-only dry-run across the organization;
- synchronization of one named repository;
- synchronization of every active repository;
- daily drift reconciliation.

Forks, archived repositories, and names listed in `excludedRepositories` are
not synchronized. Runs are serialized so that two baseline updates cannot
write to the same repository concurrently.
