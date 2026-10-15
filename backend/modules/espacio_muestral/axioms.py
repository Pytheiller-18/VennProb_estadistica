"""
axioms.py - Validaciones axiomáticas de Kolmogorov y álgebra de probabilidades.
Define excepciones especializadas y funciones de normalización del espacio muestral.
"""

EPSILON = 1e-7


class AxiomViolationError(ValueError):
    """Excepción lanzada cuando una operación viola los axiomas de Kolmogorov o las reglas de conjuntos."""
    def __init__(self, message: str, code: str = "AXIOM_VIOLATION"):
        super().__init__(message)
        self.message = message
        self.code = code


def clamp_prob(val: float) -> float:
    """Ajusta valores con pequeños errores de precisión en coma flotante."""
    if abs(val) < EPSILON:
        return 0.0
    if abs(val - 1.0) < EPSILON:
        return 1.0
    return round(val, 6)


def calc_simple_prob(a: float, s: float) -> float:
    """
    Calcula la probabilidad simple P(A) = |A| / |S|.
    Valida que S > 0 y 0 <= A <= S.
    """
    if s <= 0:
        raise AxiomViolationError(
            f"El tamaño del espacio muestral (|S| = {s}) debe ser un número estrictamente positivo.",
            code="INVALID_SAMPLE_SPACE"
        )
    if a < -EPSILON:
        raise AxiomViolationError(
            f"El conteo o cardinalidad del evento no puede ser negativo ({a}).",
            code="NEGATIVE_COUNT"
        )
    if a > s + EPSILON:
        raise AxiomViolationError(
            f"El tamaño del evento ({a}) no puede superar el tamaño del espacio muestral (|S| = {s}).",
            code="EVENT_EXCEEDS_SAMPLE_SPACE"
        )
    prob = a / s
    return clamp_prob(prob)


def validate_prob_range(val: float, name: str) -> float:
    """Verifica que una probabilidad se encuentre en el intervalo axiomático [0, 1]."""
    if val < -EPSILON or val > 1.0 + EPSILON:
        raise AxiomViolationError(
            f"La probabilidad {name} = {val} viola el primer y segundo axioma de Kolmogorov: debe estar en el intervalo [0.0, 1.0].",
            code="PROB_OUT_OF_BOUNDS"
        )
    return clamp_prob(val)
