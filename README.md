# Payload Bay organization configuration

This repository contains the shared GitHub configuration and community health files for the [Payload Bay organization](https://github.com/payloadbay).

It is not the Payload Bay application source repository. Product code and repository-specific configuration live in their respective repositories.

## What lives here

- organization-wide Issue Forms and the pull request template;
- contribution, conduct, security, and support policies;
- shared labels and metadata-labeling rules;
- pull request quality and commit conventions;
- the repository-baseline synchronizer;
- the shared Renovate preset;
- the [Payload Bay SpecKit preset and setup](.github/speckit/README.md);
- the public organization profile in [`profile/README.md`](profile/README.md).

## Repository baseline

[`REPOSITORY_BASELINE.md`](REPOSITORY_BASELINE.md) explains which files and settings are synchronized, how conflicts are handled, and how repository-specific configuration is preserved.

Changes to shared configuration are reviewed in this repository first. After merge, the Repository Baseline workflow reconciles managed Payload Bay repositories.

## Contributing and security

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before proposing a change. Report security vulnerabilities according to [`SECURITY.md`](SECURITY.md), not through a public issue.

## License

The contents of this repository are available under the [MIT License](LICENSE).
