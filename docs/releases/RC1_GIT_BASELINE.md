# RC1 Git Baseline

Date: 2026-07-01

Architecture-convergence merge: `57d4ad4e654effcd3db23d269fd4e2ca0144648e`

Route-harmonization merge: `72c35fa52692b7eb81688852f9f5a48460ec5521`

## State

- `main` matched `origin/main` after both controlled merges.
- PR #2 and PR #3 were non-draft, mergeable, and exact-head CI green.
- No conflict markers, unmerged paths, or source-tree drift remain.
- `v1.0.0-rc1` is intentionally not created while deployment gates are open.

## Recommended protection

- Require pull requests and at least one approving review.
- Require the `CI / validate` check and require branches to be current.
- Block force pushes, deletions, and direct commits to `main`.
- Require signed commits/tags and conversation resolution.
- Limit release-tag creation to release managers.

## Branch and release strategy

- Feature work: `feature/*` or `codex/*`, merged by reviewed PR.
- Release stabilization: `release/rc*`, cut only from a certified tag/baseline.
- Hotfix: `hotfix/*` from the production tag, PR to `main`, then back-merge.
- Tags: annotated, immutable SemVer tags after deployment certification.
