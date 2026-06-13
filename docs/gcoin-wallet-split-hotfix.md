# G-Coin Wallet Split Hotfix

The old worn wallet core is too heavy and can hit stack/heap when loading dialogs and user lists.

Use this split pair:

- `GC_Wallet_Core_20406_Split_Main.lsl`
- `GC_Wallet_UserPicker_20406.lsl`

Keep this existing script:

- `GC_Wallet_UI_Controller_20401`

Remove or replace this old script:

- `GC_Wallet_Core_20405`

## Placement

Both new scripts go inside the G-Coin Wallet HUD object.

The main core handles:

- Balance
- Send
- Transfer
- Request
- Admin add/send/withdraw basics
- Server replies

The user picker handles:

- `USERLIST` parsing
- Short safe dialog labels
- User list paging

## Why

LSL has tight memory limits. Splitting the picker out of the core keeps display-name decoding and user-list dialog buttons from colliding with wallet transaction logic.
