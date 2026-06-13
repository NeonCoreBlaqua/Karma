# G-Coin Admin Logging Requirements

Status: mandatory server requirement for all G-Coin owner/admin actions.

## Core Rule

Owner actions must never bypass logging.

The Owner can have full authority over the economy, but the server must still record every balance-affecting administrative action. Owner control should be complete, but never invisible.

## Why This Matters

Months later, if a balance changes unexpectedly, the G-Coin logs must show where the change came from:

- user transaction
- ATM transaction
- vendor transaction
- rental transaction
- workforce/payroll transaction
- Neuro-Link wallet transaction
- Owner/Admin action
- server maintenance action

No balance-changing action should be untraceable.

## Required Logged Admin Actions

The server must log:

- adding funds to an account
- removing funds from an account
- setting an account balance
- resetting an account
- administrative transfers
- admin withdrawals
- admin deposits
- signup bonus changes
- payroll actions
- server maintenance actions affecting balances
- account recovery actions

## Identity Rule

Permission checks must use UUIDs.

Log records must store UUIDs.

User-facing reports should show Display Names whenever possible.

```text
ownerUuid     = permission identity
ownerDisplay  = report label
accountUuid   = affected account identity
accountDisplay = affected account label
```

Display Names can change, so they are not trusted for permissions. They are included so reports are readable.

## Recommended Log Format

Permanent log records should be structured and machine-readable:

```text
logId|unixTime|source|actorUuid|actorDisplayB64|action|targetUuid|targetDisplayB64|oldChecking|oldSavings|newChecking|newSavings|amount|memoB64
```

Examples of `source`:

```text
USER
ATM
VENDOR
RENTAL
WORKFORCE
NEURO
ADMIN
SYSTEM
```

Examples of `action`:

```text
SEND
REQUEST_PAY
ATM_DEPOSIT
VENDOR_PAYMENT
RENT_PAYMENT
PAYROLL
ADMIN_ADD_FUNDS
ADMIN_REMOVE_FUNDS
ADMIN_SET_BALANCE
ADMIN_RESET_ACCOUNT
ADMIN_TRANSFER
SYSTEM_MAINTENANCE
```

## User-Facing Report Example

```text
[ADMIN]
Owner: Jah'Vict
Action: Set Balance
Account: Xavion
Old Checking: 250 GC
New Checking: 1000 GC
Date/Time: 2026-06-13 11:42 AM
```

The readable report can use Display Names, but the stored record must also include UUIDs for the owner and target account.

## Server Behavior Rule

Every function that changes money must do these steps in order:

1. Load the current account record.
2. Validate permission using UUID.
3. Validate amount and operation.
4. Save the balance change.
5. Write the log record.
6. Send the response.

If the log write fails, the server should warn the Owner and return a clear failure when possible. The preferred behavior is:

```text
No log, no invisible balance change.
```

For Second Life Linkset Data limits, if a full historical log cannot fit forever in one script, the server should still keep a recent log locally and forward full events to the permanent Camden Falls World Server when available.

## Admin Is Not A Shortcut

Admin permission can bypass normal user limits when appropriate.

Admin permission must not bypass:

- identity checks
- account existence checks
- transaction validation
- audit logging
- server error reporting

## Implementation Checklist

- Add a shared `writeAuditLog(...)` server helper.
- Call it from every user transaction.
- Call it from every admin transaction.
- Call it from server maintenance actions that affect balances.
- Store UUIDs in every log.
- Store Display Name labels where available.
- Expose readable admin reports using Display Names.
- Keep UUIDs available for debug/admin recovery.
- Never allow silent owner balance edits.
