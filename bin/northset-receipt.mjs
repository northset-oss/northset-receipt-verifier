import { readFileSync } from "node:fs";

import { verifyReceipt } from "../src/verify-receipt.mjs";

const INVALID = Object.freeze({ valid: false, code: "RECEIPT_INVALID" });

function summarize() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    return INVALID;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(args[0], "utf8"));
  } catch {
    return INVALID;
  }
  return verifyReceipt(parsed);
}

let result;
try {
  result = summarize();
} catch {
  result = INVALID;
}

process.stdout.write(JSON.stringify(result));
process.exitCode = result.valid === true ? 0 : 1;
