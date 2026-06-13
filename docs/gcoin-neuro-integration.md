# G-Coin to Neuro Integration

G-Coin is Phase 1 Wallet Tracker work.

Because AtlasVault Core is already split to avoid stack/heap collisions, do not add more logic directly into the core scripts unless absolutely necessary.

Use this safer layout:

```text
AtlasVault Core Part 1 / Part 2
        |
        v
GC_Neuro_AtlasVault_Breadcrumb_Bridge.lsl
        |
        v
CDF Tracker
        |
        v
Camden Falls World Server
        |
        v
Neuro-Link HUD
```

## Scripts

- `GC_Neuro_AtlasVault_Breadcrumb_Bridge.lsl`
  - Drop into the same linkset as AtlasVault Core part 1 and part 2.
  - Listens for existing `LM_RSP` result messages.
  - Emits `gcoin.signup`, `gcoin.payroll`, `gcoin.send`, `gcoin.transfer`, `gcoin.admin_add`, and account movement events.

- `GC_Workforce_Global_Manager_20401_Neuro.lsl`
  - Replacement for the Workforce Global Manager.
  - Emits `work.clockin`, `work.clockout`, and `work.clear`.

- `GC_Update_Server_20407_Neuro.lsl`
  - Replacement for the Update Server.
  - Emits update check/current/available/sent/denied/missing events.

- `GC_Workforce_Time_Server_20400_Neuro.lsl`
  - Replacement for the Workforce Time Server.
  - Emits `workforce.time.sync` events.

## Rule

Do not make the G-Coin HUD heavier.

Neuro should become the display layer for wallet state and alerts, while G-Coin servers and kiosks stay focused on money/workforce logic.

