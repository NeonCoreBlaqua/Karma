# G-Coin System Audit

Status: feature work is paused until G-Coin is stable.

## Current Reported State

- Send Money works.
- Request Money is broken.
- Check Balance is broken.
- Balance does not refresh/update reliably.
- Usernames display incorrectly.
- Change Texture is not working.
- Several HUD buttons are mapped incorrectly or trigger the wrong functions.
- ATM is broken or not responding properly.

## Active Protocol

- Wallet/HUD to server link message: `LM_REQ = 1000`
- Server to Wallet/HUD link message: `LM_RSP = 2000`
- Wallet UI controller to wallet core: `LM_UI = 3000`
- Split wallet picker link channel: `LM_PICK = 3100`
- Region bank channel: `BANK_CH = -777777`
- Update channel: `UPDATE_CH = -9869870`

Request format:

```text
REQ|CMD|USER|UIKEY|AMT|TARGET|EXTRA
```

Server reply format:

```text
RSP|TYPE|USER|UIKEY|...
```

## Script Responsibility Map

### AtlasVault Server

#### `sl_script_GC_AtlasVault_Core_20403_part1.txt`

Role: server router and account state owner.

Responsibilities:

- Receives `REQ` on link and region channel.
- Handles `BALANCE`.
- Handles `USERLIST`.
- Handles `SIGNUP`.
- Handles admin `ADDFUNDS`.
- Stores account data in Linkset Data.
- Stores cached display names in Linkset Data.
- Forwards transaction commands to Part 2 through `LM_TXN_REQ = 2101`.
- Sends replies through `LM_RSP = 2000` and region channel `-777777`.

Notes:

- `USERLIST` sends users as `uuid,base64DisplayName`.
- `BALANCE` should return `RSP|BAL|user|uiKey|checking|savings|ADMIN=n`.

#### `sl_script_GC_AtlasVault_Core_20403_part2.txt`

Role: transaction worker.

Responsibilities:

- Handles `DEPO`.
- Handles `WD`.
- Handles `XFER`.
- Handles `SEND`.
- Handles `ADMIN_SEND`.
- Handles `ADMIN_WD_INV`.
- Handles `ADMIN_WD_SAV`.
- Applies daily limits.
- Updates accounts and replies with `OK` plus a fresh `BAL`.

Notes:

- There is no server-side `REQ` or request-money command. Request Money is currently a HUD-local message feature.

### Wallet HUD

#### `sl_script_GC_Wallet_Core_20405.txt`

Role: original full wallet core.

Responsibilities:

- Talks to AtlasVault via link and region channel.
- Opens balance/send/request/transfer/settings/texture dialogs.
- Updates digit display links.
- Handles texture skin selection.
- Parses `USERLIST`.
- Sends local Request Money IM/chat message.

Known risks:

- Very large script. Stack/heap errors are likely.
- User list parsing and texture system live inside the same script as banking logic.
- Dialog button names can exceed SL's 24-character limit if display names are not shortened.

#### `sl_script_GC_Wallet_UI_Controller_20401.txt`

Role: HUD touch router.

Responsibilities:

- Opens/minimizes HUD.
- Reads touched link name.
- Sends touched link name to wallet core over `LM_UI = 3000`.

Important expected link names:

- `BTN_GC_TOGGLE`
- `BTN_HELP`
- `BTN_EXIT`
- `BTN_BALANCE`
- `BTN_TEXTURE`
- `BTN_TRANSFER`
- `BTN_REQUEST`
- `BTN_SEND`
- `BTN_SETTINGS`

Risk:

- If prim names do not match these exact names, button mapping will be wrong.

#### `GC_Wallet_Core_20406_Split_Main.lsl`

Role: experimental split wallet main core. Not approved for mass update yet.

Responsibilities:

- Main balance/send/transfer/request/admin flow.
- Delegates user picking to `GC_Wallet_UserPicker_20406.lsl`.

Risk:

- Texture system was intentionally not carried over yet.
- Request Money currently sends command `REQ`, but AtlasVault does not implement server-side request-money behavior.

#### `GC_Wallet_UserPicker_20406.lsl`

Role: experimental split user picker. Not approved for mass update yet.

Responsibilities:

- Parses `USERLIST`.
- Shortens display names for safe dialog buttons.
- Pages users.
- Sends selected key back to split main via `LM_PICK = 3100`.

### ATM

#### `GC_ATM_UI_20400_DisplayNames.lsl`

Role: ATM UI and HUD dispenser.

Responsibilities:

- Talks to AtlasVault through link and region channel.
- Gives `G Coin Wallet` object from inventory.
- Handles balance/deposit/send/transfer/withdraw/admin actions.
- Handles signup bonus.
- Parses server user list with display names.

Known risks:

- It can still hit `llDialog: button labels must be 24 or fewer characters long`.
- It is large and mixes ATM UI, HUD dispenser, user picking, banking, and update checks.
- Needs its own separate audit after wallet/server are stable.

### Update Server

#### `GC_Update_Server_20407_Neuro.lsl`

Role: update server plus Neuro breadcrumb reporting.

Responsibilities:

- Advertises current product builds.
- Gives update objects from inventory by exact object name.
- Reports update events to CDF Tracker.

Current state:

- HUD update push is paused.
- HUD advertised build is back to `20405`.
- Do not advertise `20406` until split wallet is verified.

### Neuro/CDF Bridge Scripts

#### `GC_Neuro_AtlasVault_Breadcrumb_Bridge.lsl`

Role: observes AtlasVault responses and emits wallet events to CDF Tracker.

Responsibilities:

- Does not replace AtlasVault.
- Reports wallet events like signup/send/transfer/admin add/payroll.

#### `Breadcrumb Wallet Auto.lsl`

Role: generic wallet/payment object breadcrumb.

Responsibilities:

- Reports touched/payment objects to CDF Tracker.
- Does not participate in actual G-Coin banking.

## Feature Test Matrix

### 1. Balance

Expected flow:

```text
Wallet button BTN_BALANCE
-> UI controller sends LM_UI BTN_BALANCE
-> Wallet core sends REQ|BALANCE|...
-> AtlasVault Part 1 replies RSP|BAL|...
-> Wallet updates dialog and digit display
```

Likely failure zones:

- Button prim is not named `BTN_BALANCE`.
- Wallet core did not receive `LM_UI`.
- Wallet core sends wrong `uiKey`.
- Server reply goes to wrong object key.
- Digit links are missing or misnamed.
- Core stack/heap prevents reply handling.

### 2. Send Money

Current state: reported working.

Expected server command:

```text
REQ|SEND|user|uiKey|amount|target
```

Server owner:

- AtlasVault Part 2.

### 3. Request Money

Current finding:

- Original wallet implements this as a local message only with `REQUEST_LOCAL`.
- Split main currently routes it as `REQ`, but AtlasVault has no `cmd == "REQ"` handler.

Likely fix direction:

- Decide whether Request Money is local-only or server-tracked.
- If local-only, keep it out of AtlasVault and restore `REQUEST_LOCAL`.
- If server-tracked, add a real request command and notification flow to AtlasVault/Neuro.

### 4. Username Display

Expected server format:

```text
uuid,base64DisplayName
```

Likely failure zones:

- Old HUD parses only UUIDs.
- Name is not cached because avatar has not touched/used system recently.
- Dialog label exceeds 24 characters.
- Split picker not installed in HUD with split main.

### 5. Texture System

Original wallet:

- Uses `HUD_TEXTURES = GC_Wallet_Skin_01` through `GC_Wallet_Skin_06`.
- Applies selected texture to `SCREEN_FACE = 4`.

Likely failure zones:

- Texture inventory names do not match exactly.
- Screen face is not face `4`.
- Button prim is not named `BTN_TEXTURE`.
- Split wallet does not currently include texture system.

### 6. Button Mapping

Expected:

- UI controller sends touched link name to wallet core.
- Wallet core maps exact link names.

Audit action:

- In-world, inspect every clickable HUD prim name.
- Compare names to expected `BTN_*` list above.
- Fix names before changing code.

### 7. ATM

Expected:

- ATM uses same server protocol as HUD.
- It gives the HUD object named `G Coin Wallet`.

Known issue:

- Long button labels still possible.

Audit action:

- Do not use ATM as proof of server failure until wallet/server baseline passes.
- Test ATM after wallet balance/send/userlist are verified.

## Stabilization Order

1. Freeze update server. Do not push new HUDs.
2. Verify AtlasVault Part 1 responds to direct `BALANCE`.
3. Verify AtlasVault Part 1 responds to direct `USERLIST`.
4. Verify AtlasVault Part 2 handles `SEND`.
5. Verify HUD button prim names.
6. Fix balance refresh.
7. Fix username display.
8. Fix request money behavior.
9. Fix texture system.
10. Fix ATM.
11. Only after all tests pass, prepare update push.
