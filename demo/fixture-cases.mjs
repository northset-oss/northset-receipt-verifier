const DISCLOSURE =
  "This provider payout is non-atomic and is not OCH on-chain escrow settlement.";

export const FIXTURE_CASE_IDS = Object.freeze([
  "valid-claimed",
  "valid-refund",
  "invalid-unknown-field",
  "invalid-missing-field",
  "invalid-schema",
  "invalid-amount-token-chain",
  "invalid-transaction-mismatch",
  "invalid-finality-order",
  "invalid-delivery-consistency",
  "invalid-settlement-flags",
  "invalid-disclosure",
  "invalid-secret-material",
  "invalid-repository-and-hashes",
  "invalid-terminal-state",
]);

const VALID_CASES = new Set(["valid-claimed", "valid-refund"]);

export function caseShouldValidate(caseId) {
  return VALID_CASES.has(caseId);
}

export function expectedSummary(receipt) {
  return Object.freeze({
    valid: true,
    schema: receipt.schema,
    terminal_state: receipt.terminalState,
    amount: receipt.amount,
    token: receipt.token,
    chain: receipt.chain,
    transaction_hash: receipt.finalizedBaseEvidence.transactionHash,
    settlement_atomic: receipt.settlementAtomic,
    och_settlement: receipt.ochSettlement,
  });
}

export function receiptsForCase(caseId) {
  const claimed = claimedReceipt();
  switch (caseId) {
    case "valid-claimed":
      return [claimed];
    case "valid-refund":
      return [refundReceipt()];
    case "invalid-unknown-field":
      return [{ ...claimed, unexpected: true }];
    case "invalid-missing-field": {
      const value = clone(claimed);
      delete value.referenceId;
      return [value];
    }
    case "invalid-schema":
      return [{ ...claimed, schema: "northset.allscale.productionReceipt.v2" }];
    case "invalid-amount-token-chain":
      return [
        { ...claimed, amountMicrounits: "51000000" },
        { ...claimed, amount: "51" },
        { ...claimed, token: "USDT" },
        { ...claimed, chain: "ARBITRUM" },
      ];
    case "invalid-transaction-mismatch":
      return [{ ...claimed, providerReportedTransactionHash: `0x${"2".repeat(64)}` }];
    case "invalid-finality-order":
      return [{
        ...claimed,
        finalizedBaseEvidence: {
          ...claimed.finalizedBaseEvidence,
          receiptBlockNumber: 1_001,
          finalizedBlockNumber: 1_000,
        },
      }];
    case "invalid-delivery-consistency":
      return [
        { ...claimed, deliveryEventId: null },
        { ...claimed, deliveredAtUnixSec: null },
        { ...claimed, deliveryFact: "NOT_DELIVERED" },
        { ...refundReceipt(), deliveryEventId: "delivery-nxp-001" },
      ];
    case "invalid-settlement-flags":
      return [
        { ...claimed, settlementAtomic: true },
        { ...claimed, ochSettlement: true },
      ];
    case "invalid-disclosure":
      return [{ ...claimed, disclosure: "Atomic escrow settlement." }];
    case "invalid-secret-material":
      return [
        { ...claimed, providerObjectId: "https://app.allscale.io/claim/secret" },
        { ...claimed, providerObjectId: `hmac-sha256:${"a".repeat(64)}` },
        { ...claimed, providerObjectId: "arn:aws:secretsmanager:ca-central-1:123:secret:nxp" },
        { ...claimed, providerObjectId: "object?api_key=secret" },
        { ...claimed, providerObjectId: "object?token=secret" },
      ];
    case "invalid-repository-and-hashes":
      return [
        { ...claimed, repositoryUrl: "https://gitlab.com/northset/receipt" },
        { ...claimed, commitSha: "A".repeat(40) },
        { ...claimed, treeSha: "a".repeat(39) },
        { ...claimed, captureArtifactSha256: "sha256:not-a-digest" },
      ];
    case "invalid-terminal-state":
      return [{ ...claimed, terminalState: "PENDING" }];
    default:
      throw new Error("unknown frozen fixture case");
  }
}

function claimedReceipt() {
  const transactionHash = `0x${"1".repeat(64)}`;
  return {
    schema: "northset.allscale.productionReceipt.v1",
    closed: true,
    payoutRecordId: "payout-nxp-001",
    releaseCommit: "1".repeat(40),
    pilotConfigId: "nxp-001",
    pilotConfigVersion: "v1",
    pilotConfigSha256: `sha256:${"a".repeat(64)}`,
    participantReferenceSha256: `sha256:${"b".repeat(64)}`,
    taskReferenceSha256: `sha256:${"c".repeat(64)}`,
    repositoryUrl: "https://github.com/northset/northset-receipt-verifier",
    repositoryOwnerNumericId: "123456",
    commitSha: "d".repeat(40),
    treeSha: "e".repeat(40),
    captureArtifactSha256: `sha256:${"f".repeat(64)}`,
    verificationResultId: "verification-nxp-001",
    verificationOutcome: "ACCEPTED",
    verificationCompletedAtUnixSec: 1_800_000_010,
    storeId: "store-nxp-001",
    referenceId: "reference-nxp-001",
    amountMicrounits: "50000000",
    amount: "50",
    token: "USDC",
    chain: "BASE",
    requestBodySha256: `sha256:${"0".repeat(64)}`,
    providerRequestId: "provider-request-nxp-001",
    providerObjectId: "provider-object-nxp-001",
    fundingEvidenceId: "funding-nxp-001",
    deliveryFact: "DELIVERED",
    deliveryEventId: "delivery-nxp-001",
    deliveredAtUnixSec: 1_800_000_020,
    providerReportedTransactionHash: transactionHash,
    finalizedBaseEvidence: {
      policyVersion: "base-mainnet-finalized-success.v1",
      chainId: 8453,
      transactionHash,
      receiptBlockNumber: 1_000,
      finalizedBlockNumber: 1_001,
      verifiedAtUnixSec: 1_800_000_030,
    },
    terminalState: "CLAIMED",
    settlementAtomic: false,
    ochSettlement: false,
    disclosure: DISCLOSURE,
  };
}

function refundReceipt() {
  return {
    ...claimedReceipt(),
    payoutRecordId: "payout-nxp-refund-001",
    providerObjectId: "provider-object-nxp-refund-001",
    deliveryFact: "NOT_DELIVERED",
    deliveryEventId: null,
    deliveredAtUnixSec: null,
    terminalState: "EXPIRED",
  };
}

function clone(value) {
  return structuredClone(value);
}
