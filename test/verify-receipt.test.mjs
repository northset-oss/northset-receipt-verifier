import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  FIXTURE_CASE_IDS,
  caseShouldValidate,
  expectedSummary,
  receiptsForCase,
} from "../demo/fixture-cases.mjs";
import { verifyReceipt } from "../src/verify-receipt.mjs";

test("function and CLI satisfy every disclosed NXP-001 receipt category", () => {
  const directory = mkdtempSync(join(tmpdir(), "northset-receipt-verifier-"));
  try {
    for (const caseId of FIXTURE_CASE_IDS) {
      const shouldValidate = caseShouldValidate(caseId);
      for (const [index, receipt] of receiptsForCase(caseId).entries()) {
        const expected = shouldValidate
          ? expectedSummary(receipt)
          : Object.freeze({ valid: false, code: "RECEIPT_INVALID" });
        const input = structuredClone(receipt);
        const actual = verifyReceipt(input);
        assert.deepEqual(actual, expected, `${caseId} function variant ${index}`);
        assert.equal(Object.isFrozen(actual), true, `${caseId} immutable variant ${index}`);
        assert.deepEqual(input, receipt, `${caseId} input mutation variant ${index}`);

        const path = join(directory, `${caseId}-${index}.json`);
        writeFileSync(path, JSON.stringify(receipt));
        const cli = spawnSync(process.execPath, ["bin/northset-receipt.mjs", path], {
          cwd: new URL("..", import.meta.url),
          encoding: "utf8",
          timeout: 5_000,
          maxBuffer: 4_096,
          env: {},
        });
        assert.equal(cli.error, undefined, `${caseId} CLI error variant ${index}`);
        assert.equal(cli.signal, null, `${caseId} CLI signal variant ${index}`);
        assert.equal(cli.status, shouldValidate ? 0 : 1, `${caseId} CLI status variant ${index}`);
        assert.equal(cli.stderr, "", `${caseId} CLI stderr variant ${index}`);
        assert.equal(cli.stdout, JSON.stringify(expected), `${caseId} CLI stdout variant ${index}`);
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI rejects malformed JSON with the stable bounded response", () => {
  const directory = mkdtempSync(join(tmpdir(), "northset-receipt-verifier-invalid-"));
  try {
    const path = join(directory, "invalid.json");
    writeFileSync(path, "not-json");
    const cli = spawnSync(process.execPath, ["bin/northset-receipt.mjs", path], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      timeout: 5_000,
      maxBuffer: 4_096,
      env: {},
    });
    assert.equal(cli.status, 1);
    assert.equal(cli.stderr, "");
    assert.equal(cli.stdout, JSON.stringify({ valid: false, code: "RECEIPT_INVALID" }));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

