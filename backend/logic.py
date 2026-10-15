"""
logic.py - Fachada unificada y compatibilidad hacia atrás para el motor matemático.
Importa y reexporta desde los submódulos:
  - backend.modules.espacio_muestral (Axiomas, Laplace, Inclusión-Exclusión y Resolución)
  - backend.modules.diagrama_venn (Particiones disjuntas)
  - backend.modules.calculadora (Combinatoria y evaluación)
"""

try:
    from backend.modules.espacio_muestral import (
        AxiomViolationError,
        EPSILON,
        clamp_prob,
        calc_simple_prob,
        validate_prob_range,
        solve_one_event,
        solve_two_events,
        solve_three_events,
    )
    from backend.modules.diagrama_venn import (
        calculate_venn_partitions_2,
        calculate_venn_partitions_3,
    )
    from backend.modules.calculadora import (
        factorial,
        nPr,
        nCr,
        to_fraction,
        safe_eval,
    )
except ImportError:
    from modules.espacio_muestral import (
        AxiomViolationError,
        EPSILON,
        clamp_prob,
        calc_simple_prob,
        validate_prob_range,
        solve_one_event,
        solve_two_events,
        solve_three_events,
    )
    from modules.diagrama_venn import (
        calculate_venn_partitions_2,
        calculate_venn_partitions_3,
    )
    from modules.calculadora import (
        factorial,
        nPr,
        nCr,
        to_fraction,
        safe_eval,
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
    "calculate_venn_partitions_2",
    "calculate_venn_partitions_3",
    "factorial",
    "nPr",
    "nCr",
    "to_fraction",
    "safe_eval",
]
