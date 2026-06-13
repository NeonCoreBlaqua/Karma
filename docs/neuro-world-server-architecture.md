# Camden Falls World Server Architecture

Neuro-Link is not a phone, a needs HUD, or a health tracker.

Neuro-Link is the display window for Camden Falls life intelligence.

```text
[World]
      |
      v
[Breadcrumbs + Neurons]
      |
      v
[CDF Tracker]
      |
      v
[Camden Falls World Server]
      |
      v
[Neuro-Link HUD]
```

## Roles

### Breadcrumb

`Breadcrumb.lsl` is a tiny opt-in script dropped into world objects.

Use it in:

- Food
- Beds
- Couches
- Baths
- Tubs
- Showers
- Drinks
- Work kiosks
- Rental kiosks
- Dispensers
- Vendor systems

Breadcrumbs announce the object and report interactions.

Auto-use Breadcrumb variants:

- `Breadcrumb Food Auto.lsl`
  - For food and drink items.
  - Emits `stat.hunger` and `stat.thirst`.
- `Breadcrumb Furniture Auto.lsl`
  - For beds, couches, chairs, baths, tubs, showers, and other furniture.
  - Emits `stat.rest` and `stat.comfort`.
- `Breadcrumb Product Auto.lsl`
  - For meds, fem products, hygiene products, wellness products, dispensers, and vendor-given items.
  - Emits `stat.health` and `stat.care`.
- `Breadcrumb Wallet Auto.lsl`
  - For G-Coin kiosks, vendors, tip jars, payout boards, rent/payment kiosks, and wallet-connected systems.
  - Emits `wallet.kind`, `wallet.amount`, and `wallet.currency`.

These scripts are opt-in. They do not scan the region. Objects become trackable because you place a Breadcrumb script inside them.

### Neurons

`Neurons.lsl` is worn by an avatar.

Avatars cannot have Breadcrumbs dropped into them, so Neurons are the wearable identity layer. Neurons announce that an avatar is a Neuro participant.

### CDF Tracker

`CDF Tracker.lsl` sits in the region and listens for Breadcrumb and Neuron events.

It does not discover every script by magic. It only tracks objects and avatars that announce themselves through the protocol.

### Camden Falls World Server

`Camden Falls World Server.lsl` receives validated tracker events, stores recent event history, and broadcasts Neuro-ready signals for the HUD.

## Event Flow

```text
Object used
  |
  v
Breadcrumb sends event
  |
  v
CDF Tracker validates and forwards
  |
  v
Camden Falls World Server stores and classifies
  |
  v
Neuro-Link HUD receives the alert/update
```

## Phase 1 Trackers

- Notification Tracker
- Location Tracker
- Housing Tracker
- Wallet Tracker / G-Coin Tracker

## Phase 2 Trackers

- Job Tracker
- Relationship Tracker
- Pregnancy Tracker
- Social Tracker

## Core Rule

```text
Neuro does not ask the player questions.
Neuro watches what the player does.
Neuro reacts.
Neuro informs.
```

## Protocol

Scripts use private region chat channels and JSON payloads.

The shared protocol token is intentionally simple in v0.1. It is not security by itself; it is a filter so unrelated objects do not accidentally enter the network.

Production security should add one or more of:

- Group checks with `llSameGroup`
- Owner/creator allowlists
- Per-region token notecards
- Server-side validation
