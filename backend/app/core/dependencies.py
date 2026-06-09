from functools import lru_cache

from app.core.config import settings
from app.services.calculator import CarbonCalculator
from app.services.factor_catalog import FactorCatalog


@lru_cache
def get_factor_catalog() -> FactorCatalog:
    return FactorCatalog.load(settings.default_factor_set)


def get_calculator() -> CarbonCalculator:
    return CarbonCalculator(get_factor_catalog())

