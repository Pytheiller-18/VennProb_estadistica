"""
Módulo de la Calculadora Científica (Casio fx-350ES PLUS).
Proporciona combinatoria (nPr, nCr, factorial), conversión de fracciones continuas (S↔D)
y evaluación segura de expresiones estadísticas y matemáticas.
"""

from .scientific import (
    factorial,
    nPr,
    nCr,
    to_fraction,
    safe_eval,
)

__all__ = [
    "factorial",
    "nPr",
    "nCr",
    "to_fraction",
    "safe_eval",
]
