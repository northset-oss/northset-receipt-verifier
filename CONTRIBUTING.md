# Contributing to NXP-001

The selected contributor may change only:

- `src/verify-receipt.mjs`
- `bin/northset-receipt.mjs`

Use Node 20.19.0, add no dependencies, and keep all output deterministic and
free of credentials or raw participant identity.

The submission commit must be a direct child of the frozen base commit. A
correction must amend or replace that one child commit rather than add another
commit.
