# Northset Receipt Verifier

NXP-001 is a small, zero-dependency Node.js implementation task. The utility
validates a `northset.allscale.productionReceipt.v1` JSON document offline and
returns a deterministic, machine-readable summary.

The selected contributor implements only:

- `src/verify-receipt.mjs`
- `bin/northset-receipt.mjs`

Run the public checks with Node 20.19.0:

```bash
npm test
```

Run the CLI with:

```bash
node bin/northset-receipt.mjs <receipt.json>
```

The task reward is exactly 50 USDC on Base. Payment eligibility is determined
by Northset's frozen NXP-001 evaluator against the exact submitted commit.

