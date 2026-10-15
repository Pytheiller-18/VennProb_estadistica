"""
scientific.py - Motor matemático para la Calculadora Científica Casio fx-350ES PLUS.
Implementa combinatoria (nPr, nCr, factorial), fracciones continuas exactas (S↔D)
y evaluación segura de expresiones con soporte para DEG/RAD/GRAD.
"""

import math
import re
from typing import Dict, Any, Optional


def factorial(n: int) -> int:
    """Calcula el factorial de n (n!). Valida n >= 0 y n <= 170."""
    if not isinstance(n, int) or n < 0:
        raise ValueError("El factorial solo está definido para números enteros no negativos.")
    if n > 170:
        raise OverflowError("El número excede el límite de representación (n > 170).")
    return math.factorial(n)


def nPr(n: int, r: int) -> int:
    """Calcula permutaciones P(n, r) = n! / (n - r)!"""
    if n < 0 or r < 0 or r > n:
        raise ValueError("En nPr debe cumplirse 0 <= r <= n.")
    return math.factorial(n) // math.factorial(n - r)


def nCr(n: int, r: int) -> int:
    """Calcula combinaciones C(n, r) = n! / (r! * (n - r)!)"""
    if n < 0 or r < 0 or r > n:
        raise ValueError("En nCr debe cumplirse 0 <= r <= n.")
    return math.comb(n, r)


def to_fraction(val: float, max_denom: int = 10000) -> Dict[str, Any]:
    """
    Algoritmo de fracciones continuas para convertir un decimal a su fracción irreducible exacta.
    Emula la tecla S↔D de la Casio fx-350ES PLUS.
    """
    if not math.isfinite(val):
        return {"numerator": 0, "denominator": 1, "exact": False, "str": str(val)}

    sign = -1 if val < 0 else 1
    x = abs(val)

    if abs(x - round(x)) < 1e-10:
        return {
            "numerator": sign * int(round(x)),
            "denominator": 1,
            "exact": True,
            "str": f"{sign * int(round(x))}"
        }

    m00, m01, m10, m11 = 1, 0, 0, 1
    b = x

    for _ in range(30):
        a = math.floor(b)
        t0 = m00 * a + m01
        m01 = m00
        m00 = t0
        t1 = m10 * a + m11
        m11 = m10
        m10 = t1

        if m10 > max_denom:
            break

        err = abs(x - m00 / m10)
        if err < 1e-11:
            break

        rem = b - a
        if rem < 1e-12:
            break
        b = 1.0 / rem

    num = sign * m00
    den = m10
    exact = abs(val - (num / den)) < 1e-6

    return {
        "numerator": num,
        "denominator": den,
        "exact": exact,
        "str": f"{num}/{den}"
    }


def safe_eval(expr: str, angle_mode: str = "DEG") -> float:
    """
    Evaluación segura de expresiones matemáticas de la calculadora Casio.
    Soporta funciones trigonométricas en grados, radianes o gradianes, logaritmos,
    potencias y combinatoria.
    """
    cleaned = expr.strip()
    cleaned = cleaned.replace("×", "*").replace("÷", "/").replace("−", "-").replace("^", "**")
    cleaned = cleaned.replace("π", str(math.pi))

    # Reemplazo de funciones especiales
    def replace_npr(match):
        n_val = int(float(match.group(1)))
        r_val = int(float(match.group(2)))
        return str(nPr(n_val, r_val))

    def replace_ncr(match):
        n_val = int(float(match.group(1)))
        r_val = int(float(match.group(2)))
        return str(nCr(n_val, r_val))

    cleaned = re.sub(r'nPr\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)', replace_npr, cleaned)
    cleaned = re.sub(r'nCr\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)', replace_ncr, cleaned)

    # Contexto matemático seguro
    def make_trig(fn):
        if angle_mode == "DEG":
            return lambda x: fn(math.radians(x))
        elif angle_mode == "GRAD":
            return lambda x: fn(x * math.pi / 200.0)
        return fn

    def make_inv_trig(fn):
        if angle_mode == "DEG":
            return lambda x: math.degrees(fn(x))
        elif angle_mode == "GRAD":
            return lambda x: fn(x) * 200.0 / math.pi
        return fn

    allowed_names = {
        "sin": make_trig(math.sin),
        "cos": make_trig(math.cos),
        "tan": make_trig(math.tan),
        "asin": make_inv_trig(math.asin),
        "acos": make_inv_trig(math.acos),
        "atan": make_inv_trig(math.atan),
        "sinh": math.sinh,
        "cosh": math.cosh,
        "tanh": math.tanh,
        "asinh": math.asinh,
        "acosh": math.acosh,
        "atanh": math.atanh,
        "sqrt": math.sqrt,
        "cbrt": lambda x: math.copysign(abs(x) ** (1/3), x),
        "log": math.log10,
        "ln": math.log,
        "exp": math.exp,
        "pi": math.pi,
        "e": math.e,
        "abs": abs,
        "round": round,
        "nPr": nPr,
        "nCr": nCr,
        "factorial": factorial,
    }

    # Validar que no contenga llamadas maliciosas ni variables no permitidas
    code = compile(cleaned, "<calc>", "eval")
    for name in code.co_names:
        if name not in allowed_names:
            raise ValueError(f"Identificador o función no permitida: '{name}'")

    result = eval(code, {"__builtins__": {}}, allowed_names)
    return float(result)
