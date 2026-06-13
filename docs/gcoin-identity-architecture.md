# G-Coin Identity Architecture

Status: architecture rule for all future G-Coin server, HUD, ATM, vendor, rental, and Neuro wallet work.

## Core Rule

G-Coin must treat UUID and Display Name as two separate identities.

```text
UUID         = internal account identity
Display Name = public user-facing identity
Agent Name   = fallback label only
```

The UUID remains the secure account key. It should be used for ownership, balance storage, transaction processing, fraud prevention, and server-side administration.

The Display Name is the label people should see in menus, receipts, logs, requests, ATM screens, vendor confirmations, rental notices, and the future Neuro-Link wallet.

## Example

```text
UUID:
8f3a6c4d-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Agent Name:
jahvict.resident

Display Name:
Jah'Vict
```

The account belongs to the UUID. The UI shows `Jah'Vict`.

## Server Storage Rule

The G-Coin Server should store identity records separately from balance records.

Balance/account records should continue to key off UUID:

```text
uuid|checking|savings
```

Identity records should map UUID to user-facing name data:

```text
uuid|base64DisplayName|base64AgentName|lastSeenUnix
```

Current server storage already includes `BBS_NAMES`. That should become the official identity cache, not a temporary helper.

## Display Name Lookup Rule

When a person interacts with any G-Coin surface, that surface should send the user's UUID to the server. The server should update or refresh the identity cache when possible.

Surfaces include:

- Wallet HUD
- ATM
- Vendor
- Rental system
- Workforce/job kiosk
- future Neuro-Link Wallet

Preferred identity order for user-facing labels:

1. cached Display Name
2. current Display Name if script can fetch it
3. Agent Name
4. shortened UUID only for admin/debug fallback

## User-Facing Rule

Normal users should not see UUIDs.

Display Names should be used in:

- account menus
- user lists
- Send Money target lists
- Request Money target lists
- ATM interaction text
- vendor payment confirmations
- rental payment confirmations
- transaction receipts
- transaction history
- Neuro-Link wallet UI
- alerts/notifications

UUIDs should only appear in:

- admin tools
- debug output
- recovery tools
- server-side account management

## Protocol Rule

Network and link-message commands should still send UUIDs for all money movement.

Example:

```text
REQ|SEND|sender_uuid|ui_key|amount|target_uuid|memo
```

The server response can include labels for display:

```text
RSP|OK|sender_uuid|ui_key|SEND|amount|target_uuid|base64TargetDisplayName
```

For user lists, keep the UUID with a safe encoded label:

```text
RSP|USERLIST|user_uuid|ui_key|target_uuid,base64DisplayName|target_uuid,base64DisplayName|ADMIN=0
```

The client should display the decoded Display Name, but any selected button must resolve back to the UUID before sending money.

## Dialog Safety Rule

Second Life dialog buttons can only be 24 characters or fewer.

Clients must never put raw long Display Names directly into dialog buttons without shortening them.

Safe button behavior:

- show a shortened Display Name on the button
- keep a separate internal map from short button label to UUID
- never send money by button text
- never use Display Name as the account key

## Transaction Log Rule

Transaction records should store UUIDs plus display labels.

This applies to normal users and Owner/Admin actions. Owner/Admin permissions can allow full control, but they must not allow invisible balance edits. See `docs/gcoin-admin-logging-requirements.md`.

Recommended permanent format:

```text
txnId|unixTime|type|fromUuid|fromDisplayB64|toUuid|toDisplayB64|amount|memoB64|status
```

This lets the server keep secure ownership while showing natural receipts:

```text
Jah'Vict sent G$250 to Xavion.
```

Instead of:

```text
8f3a6c4d-xxxx-xxxx-xxxx-xxxxxxxxxxxx sent G$250 to 3a9...
```

## Request Money Rule

Request Money should become server-backed, not HUD-local.

Request records should store both UUIDs and labels:

```text
requestId|fromUuid|fromDisplayB64|toUuid|toDisplayB64|amount|memoB64|status|createdUnix|expiresUnix
```

User-facing screens should show Display Names:

```text
Jah'Vict requested G$500 from Xavion.
```

Server-side processing should use UUIDs:

```text
fromUuid requests amount from toUuid
```

## Neuro-Link Rule

When Neuro-Link replaces the old wallet HUD, Neuro should not create a new identity system.

Neuro should ask the G-Coin Server for:

- account balance by UUID
- display label by UUID
- transaction history with display labels
- pending requests with display labels
- vendor/rental/payment alerts with display labels

Neuro should show Display Names and keep UUIDs internal.

## Migration Rule

Existing accounts should not be rebuilt or moved just to add display names.

Safe migration path:

1. Keep current UUID-based account storage.
2. Promote `BBS_NAMES` into the official identity cache.
3. Refresh identity records whenever users touch HUD, ATM, vendor, rental, or Neuro.
4. Update USERLIST clients to decode and show Display Names.
5. Update logs/receipts to include display labels.
6. Only show UUIDs in admin/debug mode.

## Implementation Checklist

- Server keeps UUID as the only account key.
- Server maintains identity cache by UUID.
- Wallet user picker displays Display Names.
- ATM user picker displays Display Names.
- Vendor confirmations display Display Names.
- Rental payment notices display Display Names.
- Transaction logs include display labels.
- Request Money records include display labels.
- Neuro wallet consumes the same server identity data.
- Admin/debug tools can still expose UUIDs when needed.

## Non-Negotiable Boundary

Display Names are not unique and can change.

That means Display Name must never become the account key.

G-Coin accounts belong to UUIDs. People-facing screens show Display Names.
