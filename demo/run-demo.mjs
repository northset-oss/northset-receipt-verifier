import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

import {
  caseShouldValidate,
  expectedSummary,
  receiptsForCase,
} from "./fixture-cases.mjs";

const fixtureIndex = process.argv.indexOf("--fixture");
const fixturePath = fixtureIndex === -1 ? undefined : process.argv[fixtureIndex + 1];
let caseId = "";
let passed = false;

try {
  const { readFile } = await import("node:fs/promises");
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  caseId = fixture.case;
  const shouldValidate = caseShouldValidate(caseId);
  const { verifyReceipt } = await import("../src/verify-receipt.mjs");
  passed = typeof verifyReceipt === "function";

  for (const [index, receipt] of receiptsForCase(caseId).entries()) {
    const expected = shouldValidate
      ? expectedSummary(receipt)
      : Object.freeze({ valid: false, code: "RECEIPT_INVALID" });
    const functionResult = verifyReceipt(structuredClone(receipt));
    passed &&= Object.isFrozen(functionResult);
    passed &&= JSON.stringify(functionResult) === JSON.stringify(expected);

    const receiptPath = `/tmp/northset-receipt-${index}.json`;
    writeFileSync(receiptPath, JSON.stringify(receipt), { mode: 0o600 });
    const cli = spawnSync(process.execPath, ["bin/northset-receipt.mjs", receiptPath], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 5_000,
      maxBuffer: 4_096,
      env: {},
    });
    passed &&= cli.error === undefined;
    passed &&= cli.signal === null;
    passed &&= cli.status === (shouldValidate ? 0 : 1);
    passed &&= cli.stderr === "";
    passed &&= cli.stdout === JSON.stringify(expected);
  }
} catch {
  passed = false;
}

const shouldValidate = caseShouldValidate(caseId);
if (passed) {
  process.stdout.write(JSON.stringify(shouldValidate
    ? {
        action: "prepare_allscale_auto_payout",
        amount: "50",
        stable_coin: 2,
        chain: 5,
      }
    : { action: "no_payout" }));
} else {
  process.stdout.write(JSON.stringify(shouldValidate
    ? { action: "no_payout" }
    : {
        action: "prepare_allscale_auto_payout",
        amount: "50",
        stable_coin: 2,
        chain: 5,
      }));
}
