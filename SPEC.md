# Northset production receipt v1 conformance

`verifyReceipt(value)` accepts one JavaScript value and returns one frozen
plain object. It must not mutate its input, read files, use the network, spawn
processes, or inspect environment credentials.

For a valid receipt it returns these keys in this order:

```json
{
  "valid": true,
  "schema": "northset.allscale.productionReceipt.v1",
  "terminal_state": "CLAIMED",
  "amount": "50",
  "token": "USDC",
  "chain": "BASE",
  "transaction_hash": "0x...",
  "settlement_atomic": false,
  "och_settlement": false
}
```

For any invalid value it returns exactly:

```json
{"valid":false,"code":"RECEIPT_INVALID"}
```

The CLI reads exactly one JSON file argument. It writes only the canonical JSON
result to stdout with no trailing newline. It exits `0` for a valid receipt and
`1` for malformed JSON or an invalid receipt. Stderr must remain empty.

## Exact receipt shape

The receipt is a non-array object with exactly these top-level keys:

```text
schema closed payoutRecordId releaseCommit pilotConfigId pilotConfigVersion
pilotConfigSha256 participantReferenceSha256 taskReferenceSha256 repositoryUrl
repositoryOwnerNumericId commitSha treeSha captureArtifactSha256
verificationResultId verificationOutcome verificationCompletedAtUnixSec
storeId referenceId amountMicrounits amount token chain requestBodySha256
providerRequestId providerObjectId fundingEvidenceId deliveryFact
deliveryEventId deliveredAtUnixSec providerReportedTransactionHash
finalizedBaseEvidence terminalState settlementAtomic ochSettlement disclosure
```

`finalizedBaseEvidence` has exactly:

```text
policyVersion chainId transactionHash receiptBlockNumber finalizedBlockNumber
verifiedAtUnixSec
```

Required literals:

- `schema`: `northset.allscale.productionReceipt.v1`
- `closed`: `true`
- `verificationOutcome`: `ACCEPTED`
- `amountMicrounits`: `50000000`
- `amount`: `50`
- `token`: `USDC`
- `chain`: `BASE`
- `finalizedBaseEvidence.policyVersion`: `base-mainnet-finalized-success.v1`
- `finalizedBaseEvidence.chainId`: `8453`
- `settlementAtomic`: `false`
- `ochSettlement`: `false`
- `disclosure`: `This provider payout is non-atomic and is not OCH on-chain escrow settlement.`

`terminalState` is `CLAIMED`, `CANCELLED`, or `EXPIRED`. The provider-reported
transaction hash must equal the finalized transaction hash, and the receipt
block must not exceed the finalized block.

`deliveryFact` is `DELIVERED` only when both `deliveryEventId` and
`deliveredAtUnixSec` are present. For `NOT_DELIVERED`, both must be null.

Identifiers are non-empty strings of at most 256 characters. Unix times and
block numbers are non-negative safe integers. Nullable provider/funding IDs
must otherwise be identifiers. Git commits and trees are 40 lowercase hex
characters; transaction hashes are `0x` plus 64 lowercase hex characters;
SHA-256 evidence values are `sha256:` plus 64 lowercase hex characters; and
the repository URL is exactly `https://github.com/<owner>/<repository>`.

The serialized receipt must not contain a Claim Link, `hmac-sha256:` value,
AWS Secrets Manager ARN, or query parameter named access token, API key,
API secret, key, secret, or token.

