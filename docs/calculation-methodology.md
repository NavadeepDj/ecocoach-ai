# Calculation Methodology

## Reporting Period

The calculator reports estimated kilograms of CO2 equivalent per month.

Weekly transport activity is converted to a monthly average using:

```text
monthly distance = weekly distance * 52 / 12
```

Flights and electricity are accepted as monthly values. Food and waste use
coarse monthly behavioral proxies in the initial demo catalog.

## Categories

```text
transport =
  monthly_car_km * car_factor +
  monthly_bus_km * bus_factor +
  monthly_train_km * train_factor +
  monthly_flight_km * flight_factor

electricity = monthly_electricity_kwh * grid_factor
food = monthly_food_proxy[diet_type]
waste = monthly_waste_proxy[waste_level]
total = transport + electricity + food + waste
```

## Carbon Health Score

The initial score compares the monthly estimate with a configurable monthly
target derived from a 2 tCO2e annual lifestyle target:

```text
score = round(100 / (1 + total / monthly_target))
```

The score is clamped to 0-100. A score is a communication aid, not a scientific
measurement or moral judgment.

## Factor Sources And Limitations

The `india-demo-2025.1` catalog is a transparent MVP factor set:

- Electricity is anchored to the Central Electricity Authority's CO2 Baseline
  Database for the Indian Power Sector.
- Transport values are representative passenger-mode factors informed by the
  UK government's annually versioned greenhouse-gas conversion-factor
  methodology.
- Food and waste values are coarse behavioral proxies intended to support
  relative coaching. They require replacement with region-specific,
  peer-reviewed lifecycle factors before production claims are made.

Every response includes the factor-set version and caveats. Historical
calculations must retain that version.

## Important Limitations

- Results are estimates, not a complete lifecycle inventory.
- Geography, vehicle occupancy, fuel type, electricity supplier, household
  size, and consumption details can materially change results.
- Food and waste values are intentionally broad proxies.
- Factors must never be updated without creating a new catalog version.

