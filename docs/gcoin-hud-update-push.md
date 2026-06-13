# G-Coin HUD Update Push

Use `GC_Update_Server_20407_Neuro.lsl` as the active update server script.

Current advertised wallet build:

- Product: `GCOIN_WALLET_HUD`
- Build: `20406`
- Inventory object name: `G Coin Wallet`

## Required Inventory

The update server object must contain the full updated HUD object named exactly:

`G Coin Wallet`

That HUD object should contain:

- `GC_Wallet_Core_20406_Split_Main`
- `GC_Wallet_UserPicker_20406`
- `GC_Wallet_UI_Controller_20401`

The old script `GC_Wallet_Core_20405` should not be inside the updated HUD object.

## How Existing HUDs Receive It

Old wallet HUDs report:

`GCOIN_WALLET_HUD | 20405`

The update server now advertises:

`GCOIN_WALLET_HUD | 20406`

So old HUDs should receive `UPDATE_AVAILABLE` and request `UPDATE_GET`. The server then gives the owner the updated full HUD object from inventory.

## Important

If the update server says `UPDATE_MISSING`, the object named `G Coin Wallet` is not inside the update server inventory or is not an object.
