# ADR-0036: CI/CD quality gates and release pipeline

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** tooling, ops, security
- **Supersedes:** —

## Context and problem statement

The CI workflow only ran lint, typecheck, test and build. Nothing checked that the generated code
and the class diagram matched the sources, that dependencies were free of known vulnerabilities,
that the production images started, or that a backup could be restored. Images were never
published, so there was nothing versioned to deploy.

## Decision drivers

- A pull request must not reach `main` unless the product still builds, starts and works.
- Generated artifacts (contracts, hooks, class diagram) are committed, so they must be verified.
- Supply chain: pinned actions, known vulnerabilities blocked, SBOM and provenance on images.
- Only free GitHub features; nothing that needs an extra account.

## Considered options

1. GitHub Actions with separate jobs per gate, e2e on the production compose, GHCR for images.
2. A single CI job running `pnpm lint typecheck test build`.
3. An external CI or registry (CircleCI, Docker Hub).

## Decision outcome

Chosen option: **1. Separate GitHub Actions jobs and GHCR.**

`ci.yml` (every pull request and push to `main`). Each job is a required status check:

| Job | Gate |
| --- | --- |
| Lint | `biome ci` (format, lint, architecture rules) and `pnpm lint:comments` (ADR-0035) |
| Typecheck | `pnpm typecheck` |
| Tests | `pnpm test` (unit, HTTP and in-memory Mongo) |
| Build | `pnpm build` |
| Generated | `pnpm codegen:check` and `pnpm docs:check` (class diagram up to date) |
| Audit | `pnpm audit --prod --audit-level high` |
| Conventional commits | every commit message of the PR (pull requests only) |
| Dependency review | blocks PRs that add a dependency with a high advisory |
| E2E | builds both production images, starts `docker-compose.prod.yml` with throwaway secrets, runs `pnpm smoke`, the backup/restore drill, and smoke again |

Other workflows:

- `codeql.yml`: CodeQL `security-extended` for TypeScript and for the workflows themselves,
  on PRs, on `main` and weekly.
- `release.yml`: on `main` and on `v*.*.*` tags, builds `linux/amd64` and `linux/arm64` images,
  pushes them to `ghcr.io/org-mentora/mentora-{api,web}` with tags `sha-<commit>`, `X.Y.Z`, `X.Y`
  and `latest` (tags only), with an SBOM and `mode=max` provenance attestations.
- `dependabot.yml`: weekly updates for npm, GitHub Actions and Docker base images. pnpm's
  `minimumReleaseAge` still applies.

Rules:

- Every third-party action is pinned by full commit SHA with the version in a comment.
- Workflows get `contents: read` by default; only `release.yml` gets `packages: write`.
- The class diagram is generated from the TypeScript AST (`tools/docs/class-diagram.mjs`,
  `pnpm docs:classes`) into `docs/architecture/class-diagram.md`.
- Image vulnerability scanning with `aquasecurity/trivy-action` is **not** used: its tags were
  compromised in March 2026 (CVE-2026-33634, GHSA-69fq-xp46-6x23). Dependency review, `pnpm audit`,
  CodeQL and Dependabot cover the gap until a scanner is re-evaluated.

### Consequences

- 👍 `main` always has working images, a passing smoke test and a proven restore.
- 👍 Every deployed image is traceable to a commit, with SBOM and provenance.
- 👎 The e2e job takes several minutes; it only starts after the fast gates pass.
- 👎 Pinned SHAs need Dependabot PRs to move; that is the intended trade-off.

## Enforcement

- Branch protection on `main`: require the CI jobs above, CodeQL and one review
  ([ci-cd.md](../operations/ci-cd.md)).
- `pnpm docs:check` also runs in the Lefthook pre-commit hook when TypeScript sources change.

## References

- ADR-0010 (codegen), ADR-0013 (Biome), ADR-0035 (comments), ADR-0038 (images), ADR-0039 (backups)
- Aqua Security, "Trivy supply chain attack" advisory, March 2026; OSV GHSA-69fq-xp46-6x23
