const SCHEMA = "northset.allscale.productionReceipt.v1";
const POLICY_VERSION = "base-mainnet-finalized-success.v1";
const CHAIN_ID = 8453;
const DISCLOSURE =
  "This provider payout is non-atomic and is not OCH on-chain escrow settlement.";

const RECEIPT_KEYS = Object.freeze([
  "schema",
  "closed",
  "payoutRecordId",
  "releaseCommit",
  "pilotConfigId",
  "pilotConfigVersion",
  "pilotConfigSha256",
  "participantReferenceSha256",
  "taskReferenceSha256",
  "repositoryUrl",
  "repositoryOwnerNumericId",
  "commitSha",
  "treeSha",
  "captureArtifactSha256",
  "verificationResultId",
  "verificationOutcome",
  "verificationCompletedAtUnixSec",
  "storeId",
  "referenceId",
  "amountMicrounits",
  "amount",
  "token",
  "chain",
  "requestBodySha256",
  "providerRequestId",
  "providerObjectId",
  "fundingEvidenceId",
  "deliveryFact",
  "deliveryEventId",
  "deliveredAtUnixSec",
  "providerReportedTransactionHash",
  "finalizedBaseEvidence",
  "terminalState",
  "settlementAtomic",
  "ochSettlement",
  "disclosure",
]);

const EVIDENCE_KEYS = Object.freeze([
  "policyVersion",
  "chainId",
  "transactionHash",
  "receiptBlockNumber",
  "finalizedBlockNumber",
  "verifiedAtUnixSec",
]);

const TERMINAL_STATES = Object.freeze(["CLAIMED", "CANCELLED", "EXPIRED"]);

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const COMMIT_OR_TREE = /^[0-9a-f]{40}$/;
const TRANSACTION_HASH = /^0x[0-9a-f]{64}$/;
const SHA256_EVIDENCE = /^sha256:[0-9a-f]{64}$/;
const REPOSITORY_URL =
  /^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

const CLAIM_LINK = /https?:\/\/[^\s"']*\/claim\//i;
const HMAC_SHA256 = /hmac-sha256:/i;
const SECRETS_MANAGER_ARN = /arn:aws:secretsmanager:/i;
const SECRET_QUERY_PARAMETER =
  /[?&](?:access[-_]?token|api[-_]?key|api[-_]?secret|key|secret|token)=/i;

const INVALID = Object.freeze({ valid: false, code: "RECEIPT_INVALID" });

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function read(record, key) {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor === undefined ? undefined : descriptor.value;
}

function hasExactKeys(record, keys) {
  const present = Object.keys(record);
  if (present.length !== keys.length) {
    return false;
  }
  return keys.every((key) => Object.prototype.hasOwnProperty.call(record, key));
}

function isIdentifier(value) {
  return typeof value === "string" && IDENTIFIER.test(value);
}

function isNullableIdentifier(value) {
  return value === null || isIdentifier(value);
}

function isUnsignedInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function matches(pattern, value) {
  return typeof value === "string" && pattern.test(value);
}

function carriesSecretMaterial(receipt) {
  const serialized = JSON.stringify(receipt);
  if (typeof serialized !== "string") {
    return true;
  }
  return (
    CLAIM_LINK.test(serialized) ||
    HMAC_SHA256.test(serialized) ||
    SECRETS_MANAGER_ARN.test(serialized) ||
    SECRET_QUERY_PARAMETER.test(serialized)
  );
}

function evidenceIsValid(evidence, reportedTransactionHash) {
  if (!isRecord(evidence) || !hasExactKeys(evidence, EVIDENCE_KEYS)) {
    return false;
  }
  if (read(evidence, "policyVersion") !== POLICY_VERSION) {
    return false;
  }
  if (read(evidence, "chainId") !== CHAIN_ID) {
    return false;
  }
  const transactionHash = read(evidence, "transactionHash");
  if (!matches(TRANSACTION_HASH, transactionHash)) {
    return false;
  }
  if (reportedTransactionHash !== transactionHash) {
    return false;
  }
  const receiptBlockNumber = read(evidence, "receiptBlockNumber");
  const finalizedBlockNumber = read(evidence, "finalizedBlockNumber");
  if (!isUnsignedInteger(receiptBlockNumber) || !isUnsignedInteger(finalizedBlockNumber)) {
    return false;
  }
  if (receiptBlockNumber > finalizedBlockNumber) {
    return false;
  }
  return isUnsignedInteger(read(evidence, "verifiedAtUnixSec"));
}

function deliveryIsConsistent(receipt) {
  const deliveryFact = read(receipt, "deliveryFact");
  const deliveryEventId = read(receipt, "deliveryEventId");
  const deliveredAtUnixSec = read(receipt, "deliveredAtUnixSec");
  if (deliveryFact === "DELIVERED") {
    return isIdentifier(deliveryEventId) && isUnsignedInteger(deliveredAtUnixSec);
  }
  if (deliveryFact === "NOT_DELIVERED") {
    return deliveryEventId === null && deliveredAtUnixSec === null;
  }
  return false;
}

function receiptIsValid(receipt) {
  if (!isRecord(receipt) || !hasExactKeys(receipt, RECEIPT_KEYS)) {
    return false;
  }
  if (
    read(receipt, "schema") !== SCHEMA ||
    read(receipt, "closed") !== true ||
    read(receipt, "verificationOutcome") !== "ACCEPTED" ||
    read(receipt, "amountMicrounits") !== "50000000" ||
    read(receipt, "amount") !== "50" ||
    read(receipt, "token") !== "USDC" ||
    read(receipt, "chain") !== "BASE" ||
    read(receipt, "settlementAtomic") !== false ||
    read(receipt, "ochSettlement") !== false ||
    read(receipt, "disclosure") !== DISCLOSURE
  ) {
    return false;
  }
  if (!TERMINAL_STATES.includes(read(receipt, "terminalState"))) {
    return false;
  }
  if (
    !isIdentifier(read(receipt, "payoutRecordId")) ||
    !isIdentifier(read(receipt, "pilotConfigId")) ||
    !isIdentifier(read(receipt, "pilotConfigVersion")) ||
    !isIdentifier(read(receipt, "repositoryOwnerNumericId")) ||
    !isIdentifier(read(receipt, "verificationResultId")) ||
    !isIdentifier(read(receipt, "storeId")) ||
    !isIdentifier(read(receipt, "referenceId"))
  ) {
    return false;
  }
  if (
    !isNullableIdentifier(read(receipt, "providerRequestId")) ||
    !isNullableIdentifier(read(receipt, "providerObjectId")) ||
    !isNullableIdentifier(read(receipt, "fundingEvidenceId"))
  ) {
    return false;
  }
  if (
    !matches(COMMIT_OR_TREE, read(receipt, "releaseCommit")) ||
    !matches(COMMIT_OR_TREE, read(receipt, "commitSha")) ||
    !matches(COMMIT_OR_TREE, read(receipt, "treeSha"))
  ) {
    return false;
  }
  if (
    !matches(SHA256_EVIDENCE, read(receipt, "pilotConfigSha256")) ||
    !matches(SHA256_EVIDENCE, read(receipt, "participantReferenceSha256")) ||
    !matches(SHA256_EVIDENCE, read(receipt, "taskReferenceSha256")) ||
    !matches(SHA256_EVIDENCE, read(receipt, "captureArtifactSha256")) ||
    !matches(SHA256_EVIDENCE, read(receipt, "requestBodySha256"))
  ) {
    return false;
  }
  if (!matches(REPOSITORY_URL, read(receipt, "repositoryUrl"))) {
    return false;
  }
  if (!matches(TRANSACTION_HASH, read(receipt, "providerReportedTransactionHash"))) {
    return false;
  }
  if (!isUnsignedInteger(read(receipt, "verificationCompletedAtUnixSec"))) {
    return false;
  }
  if (!deliveryIsConsistent(receipt)) {
    return false;
  }
  if (
    !evidenceIsValid(
      read(receipt, "finalizedBaseEvidence"),
      read(receipt, "providerReportedTransactionHash"),
    )
  ) {
    return false;
  }
  return !carriesSecretMaterial(receipt);
}

export function verifyReceipt(value) {
  try {
    if (!receiptIsValid(value)) {
      return INVALID;
    }
    return Object.freeze({
      valid: true,
      schema: read(value, "schema"),
      terminal_state: read(value, "terminalState"),
      amount: read(value, "amount"),
      token: read(value, "token"),
      chain: read(value, "chain"),
      transaction_hash: read(read(value, "finalizedBaseEvidence"), "transactionHash"),
      settlement_atomic: read(value, "settlementAtomic"),
      och_settlement: read(value, "ochSettlement"),
    });
  } catch {
    return INVALID;
  }
}
