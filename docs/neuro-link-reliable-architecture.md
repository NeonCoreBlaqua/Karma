# Neuro-Link Reliable Architecture

Neuro-Link should not depend on media for core survival features.

Media is the premium interface. LSL is the reliable control layer. The server is the source of truth.

## Final Direction

```text
World objects / HUD controls
        |
        v
LSL trackers, breadcrumbs, and safe-mode HUD scripts
        |
        v
Camden Falls / G-Coin servers
        |
        v
Media HUD premium UI
```

## Media Should Handle

- Rich wallet dashboards
- Profile cards and editing
- Notification feed UI
- DM inbox UI
- Settings panels
- Visual summaries, history, and search

Media can fail without stranding the player.

## LSL Should Handle

- HUD open/close
- Media refresh/reload
- Wallet safe mode
- Balance checks
- Transfer between checking and savings
- Sending G-Coin to residents
- Request fallback messages
- Alert fallback menus
- Server status checks
- Reset and recovery commands

LSL dialogs are not the premium experience, but they are the dependable one.

## Server Should Handle

- UUID account ownership
- Display name cache
- Checking and savings balances
- Transfers
- Admin actions
- Transaction logs
- Notifications
- Rental/vendor/job events
- Tracker/breadcrumb events
- Future Neuro wallet APIs

The HUD never owns money. It only asks the server.

## Required Fallback Commands

Neuro should always keep these available:

- `/77 wallet`
- `/77 balance`
- `/77 send`
- `/77 request`
- `/77 transfer`
- `/77 refresh`
- `/77 reset`

## Rule

If a feature is critical, it needs an LSL path before it gets a media-only polish pass.

