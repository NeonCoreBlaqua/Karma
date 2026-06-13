# Camden Falls Breadcrumb Bridges

These scripts let existing Camden Falls systems report into Neuro without rewriting the original scripts.

## Rentals

`CDF_Rentals_Breadcrumb_Bridge.lsl`

Drop this into the same rental kiosk linkset as:

- `Camden_Falls_Rentals_Menu_20404`
- `Camden_Falls_Rentals_Tenant_20405`
- `Camden_Falls_Rentals_Owner_20405`
- `Camden_Falls_Rentals_Monitor_20405`

It watches rental linkset data and reports:

- `housing.available`
- `housing.reserved`
- `housing.occupied`
- `housing.past_due`
- `housing.payment`
- `housing.rent_due`
- `housing.tenant.set`
- `housing.tenant.clear`
- `housing.viewed`

## Lights

`CDF_Light_System_Breadcrumb_Bridge.lsl`

Drop this into a Camden Falls light controller, scanner, or switch object.

It listens to the existing light channels and reports:

- `light.street.command`
- `light.street.status`
- `light.home_business.command`
- `light.update.scan`
- `light.update.version`

## Rule

Use bridges first. Only bake Breadcrumb logic directly into large scripts when a bridge cannot see the event cleanly.
