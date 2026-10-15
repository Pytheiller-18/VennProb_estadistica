"""
Módulo del Espacio Muestral y Solucionador de Probabilidad.
Proporciona validación axiomática, regla de Laplace, principio de inclusión-exclusión
y resolución paso a paso para 1, 2 y 3 eventos.
"""

from .axioms import (
    AxiomViolationError,
    EPSILON,
    clamp_prob,
    calc_simple_prob,
    validate_prob_range,
)
from .solver import (
    solve_one_event,
    solve_two_events,
    solve_three_events,
)

__all__ = [
    "AxiomViolationError",
    "EPSILON",
    "clamp_prob",
    "calc_simple_prob",
    "validate_prob_range",
    "solve_one_event",
    "solve_two_events",
    "solve_three_events",
]
