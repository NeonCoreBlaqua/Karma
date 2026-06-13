# G-Coin Server Backbone Audit

Status: feature work is paused until the G-Coin backbone is stable.

## North Star

G-Coin is no longer a test HUD. The permanent system is the server.

The current wallet HUD, ATMs, vendors, workforce kiosks, and the future Neuro wallet module should all be treated as clients. They can request balances, send payments, create requests, and show results, but the permanent truth must stay in the G-Coin Server.

Identity rule: UUID is the internal account key. Display Name is the public label shown to users. See `docs/gcoin-identity-architecture.md`.

Logging rule: every balance-affecting action must be logged, including Owner/Admin actions. See `docs/gcoin-admin-logging-requirements.md`.

```text
Wallet HUD / Neuro Wallet / ATM / Vendors / Workforce
        |
        v
G-Coin Server / AtlasVault
        |
        v
Balances, accounts, limits, transactions, requests
```

## Permanent Core Server Scripts

### `sl_script_GC_AtlasVault_Core_20403_part1.txt`

Keep. This is a core server script.

Role: server router, account owner, name cache, signup handler, payroll entry point, and status owner.

Current responsibilities:

- Owns `BBS_ACCOUNTS` Linkset Data storage.
- Owns `BBS_SIGNUP_CLAIMED`.
- Owns `BBS_SETTINGS`.
- Owns `BBS_NAMES`.
- Owns `GC_SERVER_STATUS`.
- Handles `BALANCE`.
- Handles `USERLIST`.
- Handles `SIGNUP`.
- Handles admin `ADDFUNDS`.
- Handles trusted `PAYROLL`.
- Routes transaction commands to Part 2 with `LM_TXN_REQ = 2101`.

This script should become cleaner and stricter, but it should not be retired.

### `sl_script_GC_AtlasVault_Core_20403_part2.txt`

Keep. This is a core server script.

Role: transaction worker.

Current responsibilities:

- Handles `DEPO`.
- Handles `WD`.
- Handles `XFER`.
- Handles `SEND`.
- Handles `ADMIN_SEND`.
- Handles `ADMIN_WD_INV`.
- Handles `ADMIN_WD_SAV`.
- Applies daily send and transaction limits.
- Updates account balances.
- Sends `OK`, `FAIL`, and refreshed `BAL` responses.

This is where the actual money movement lives. Future work should protect this script from client-specific UI behavior.

### `GC_Update_Server_20407_Neuro.lsl`

Keep, but do not use for a broad HUD rollout until G-Coin is stable.

Role: update distributor, not financial truth.

Current responsibilities:

- Advertises current update builds.
- Gives update objects from inventory.
- Reports update activity to CDF/Neuro tracking.

Current rule: leave the advertised wallet build at the known live build until the replacement is tested end to end.

## Temporary HUD / Client Scripts

### `sl_script_GC_Wallet_Core_20405.txt`

Temporary. Keep live users working, but plan to retire when Neuro wallet replaces the old HUD.

Role: original wallet brain.

Current responsibilities:

- Balance requests.
- Send money.
- Request money local flow.
- Transfer checking/savings.
- Texture menu.
- User list parsing.
- Digit display updates.
- Update checks.

Known problems:

- Too much logic in one script.
- Stack/heap risk.
- Dialog label length risk.
- Request Money is not server-backed.
- Texture, display, banking, picker, and update behavior are mixed together.

### `sl_script_GC_Wallet_UI_Controller_20401.txt`

Temporary. Retire with the old wallet HUD unless the old HUD stays around as a legacy client.

Role: touch router for HUD prim buttons.

Important link names:

- `BTN_GC_TOGGLE`
- `BTN_HELP`
- `BTN_EXIT`
- `BTN_BALANCE`
- `BTN_TEXTURE`
- `BTN_TRANSFER`
- `BTN_REQUEST`
- `BTN_SEND`
- `BTN_SETTINGS`

If in-world prim names do not match, buttons can trigger the wrong feature.

### `GC_Wallet_Core_20406_Split_Main.lsl`

Experimental only. Do not push to everyone yet.

Role: split wallet main script.

Known gaps:

- Texture system is not fully carried over.
- Request Money currently needs redesign because AtlasVault has no server-side request command yet.
- Needs in-world compile and feature testing before update server advertising.

### `GC_Wallet_UserPicker_20406.lsl`

Experimental only. Do not push to everyone yet.

Role: split-out user picker.

Good direction:

- Keeps long display names away from dialog buttons.
- Helps reduce stack/heap pressure in the main wallet script.

Still needs full test coverage with the main wallet and AtlasVault.

## ATM Scripts

### `GC_ATM_UI_20400_DisplayNames.lsl`

Keep as a public banking interface, but audit separately.

Role: ATM UI, account actions, and wallet dispenser.

Current responsibilities:

- Talks to AtlasVault.
- Gives the wallet object from inventory.
- Handles balance, deposit, send, transfer, withdraw, and admin flows.
- Handles signup.
- Parses user lists.

Known problems:

- Still hits `llDialog: button labels must be 24 or fewer characters long`.
- Mixes ATM UI, banking client, picker, update behavior, and dispenser behavior.
- Needs button-label hardening and feature-by-feature testing.

The ATM should not own balances. It should only send clean requests to AtlasVault.

## Vendor / Workforce / Integration Scripts

### `sl_script_GC_Workforce_Global_Manager_20401.txt`

Keep as an integration client, not as the money ledger.

Role: workforce/job system manager.

Expected relationship to G-Coin:

- Can trigger payroll or job payment requests.
- Should not store final player balances.
- Should use trusted server commands.

### `sl_script_GC_Workforce_Time_Server_20400.txt`

Keep as an integration client, not as the money ledger.

Role: workforce time tracking.

Expected relationship to G-Coin:

- Can feed payroll timing.
- Should not become a separate wallet system.

### `GC_Workforce_Global_Manager_20401_Neuro.lsl`

Keep as a Neuro/CDF-aware version only if it preserves the G-Coin server contract.

Role: workforce integration plus Neuro breadcrumb reporting.

### `GC_Workforce_Time_Server_20400_Neuro.lsl`

Keep as a Neuro/CDF-aware version only if it preserves the G-Coin server contract.

Role: workforce time integration plus Neuro breadcrumb reporting.

### `GC_Neuro_AtlasVault_Breadcrumb_Bridge.lsl`

Keep as an observer, not as a bank.

Role: reports G-Coin activity into the CDF/Neuro tracking layer.

Important boundary:

- It should never become responsible for account balances.
- It should never replace AtlasVault.

### `Breadcrumb Wallet Auto.lsl`

Keep only as tracking/support.

Role: reports wallet/payment object interactions to CDF Tracker.

It is not a financial server script.

## Vendor Scripts Still Needed

No dedicated vendor payment script has been identified yet in the current file set.

When vendor scripts are added, they should be classified as G-Coin clients:

- Vendor sends payment request to AtlasVault.
- AtlasVault validates and moves money.
- Vendor receives success/failure.
- Vendor delivers product only after success.

Vendors should not store balances or invent their own payment truth.

## What Neuro Replaces Later

Retire when Neuro wallet is ready:

- `sl_script_GC_Wallet_Core_20405.txt`
- `sl_script_GC_Wallet_UI_Controller_20401.txt`
- old wallet HUD object/interface
- experimental split wallet scripts if Neuro replaces them before they become production

Do not retire:

- AtlasVault Part 1
- AtlasVault Part 2
- permanent update server
- ATM public banking interface, unless a new ATM client replaces it
- workforce/job integrations
- vendor payment clients

## Server Problems To Fix First

### 1. Request Money Has No Permanent Server Model

Right now Request Money is not a true server feature. The old HUD handled it locally as a message/request flow.

Permanent fix:

- Add server-side request records.
- Support create, list, pay, cancel, expire.
- Let HUD, ATM, vendors, and Neuro all show the same request truth.

Suggested future commands:

```text
REQUEST_CREATE
REQUEST_LIST
REQUEST_PAY
REQUEST_CANCEL
REQUEST_EXPIRE
```

### 2. Balance Must Be Tested Directly Against AtlasVault

Before fixing HUD buttons, test the server directly:

```text
REQ|BALANCE|user_uuid|ui_key|0|00000000-0000-0000-0000-000000000000|
```

Expected:

```text
RSP|BAL|user_uuid|ui_key|checking|savings|ADMIN=n
```

If this works, the bug is in HUD routing/display. If it fails, the bug is server-side.

### 3. User Display Names Need A Stable Rule

The server currently uses UUIDs as the true identity and sends display names as labels.

Permanent rule:

- UUID is the account ID.
- Display name is only a label.
- Dialog labels must be shortened to 24 characters or less.
- Money movement should never depend on a display name.

### 4. Button Mapping Must Be Verified Separately

Wrong button behavior is probably client-side, not server-side.

Verification rule:

- Touch a HUD button.
- Confirm the exact link name.
- Confirm the exact command sent to AtlasVault.
- Confirm the exact server response.

### 5. Error Handling Should Be Standardized

Every client should understand the same server responses:

```text
RSP|OK|...
RSP|FAIL|...
RSP|BAL|...
RSP|USERLIST|...
```

Future responses should include clear machine-readable types, not only human text.

## Stabilization Order

1. AtlasVault direct balance test.
2. AtlasVault direct user list test.
3. AtlasVault direct send test.
4. AtlasVault direct transfer test.
5. Decide and implement server-side Request Money.
6. Test ATM against AtlasVault.
7. Test old wallet HUD against AtlasVault.
8. Only then decide whether to update the distributed HUD.
9. Build Neuro wallet as a new client against the stable server API.

## Immediate Recommendation

Do not push a new wallet HUD yet.

Build or use a tiny in-world G-Coin server test client first. That client should talk directly to AtlasVault without the HUD, ATM, or texture system involved. Once the server passes direct tests, the broken pieces can be fixed one by one without guessing where the bug lives.
