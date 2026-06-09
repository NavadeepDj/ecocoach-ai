import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class FactorCatalog:
    data: dict[str, Any]

    @classmethod
    def load(cls, factor_set_id: str) -> "FactorCatalog":
        path = (
            Path(__file__).resolve().parent.parent
            / "data"
            / "emission_factors"
            / f"{factor_set_id}.json"
        )
        if not path.exists():
            raise ValueError(f"Unknown emission factor set: {factor_set_id}")

        data = json.loads(path.read_text(encoding="utf-8"))
        cls._validate(data, factor_set_id)
        return cls(data=data)

    @staticmethod
    def _validate(data: dict[str, Any], factor_set_id: str) -> None:
        required = {
            "id",
            "effective_date",
            "geography",
            "monthly_target_kg_co2e",
            "transport_kg_co2e_per_passenger_km",
            "electricity_kg_co2e_per_kwh",
            "food_monthly_kg_co2e",
            "waste_monthly_kg_co2e",
            "sources",
            "caveats",
        }
        missing = required.difference(data)
        if missing:
            raise ValueError(
                f"Emission factor set {factor_set_id} is missing: {sorted(missing)}"
            )
        if data["id"] != factor_set_id:
            raise ValueError("Emission factor filename and id must match")

    def public_metadata(self) -> dict[str, object]:
        return {
            "id": self.data["id"],
            "name": self.data["name"],
            "effective_date": self.data["effective_date"],
            "geography": self.data["geography"],
            "sources": self.data["sources"],
            "caveats": self.data["caveats"],
        }

