# Security policy

Mentora handles clinical data. We take every report seriously.

## Reporting a vulnerability

- Do **not** open a public issue.
- Use GitHub's private vulnerability reporting (**Security → Report a vulnerability**) on this
  repository, or email the maintainers listed in the repository settings.
- Include the affected version or commit, the steps to reproduce, and the impact you expect.
- Do not access, change or delete data that is not yours, and do not run denial-of-service tests.

We confirm receipt within 3 business days and send a first assessment within 10 business days.
Fixes are released as a patch version; the advisory is published once users can upgrade.

## Supported versions

Only the latest minor release receives security fixes.

## What is in place

See [production readiness → Security](docs/operations/production-readiness.md#security) for the
controls and the known gaps, and [ADR-0036](docs/adr/0036-ci-cd-quality-gates.md) for the
supply-chain checks run on every pull request.
