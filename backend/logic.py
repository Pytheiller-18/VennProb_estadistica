"""
logic.py - Motor matemático para cálculo de probabilidades y diagramas de Venn (2 y 3 eventos).
Implementa axiomas de Kolmogorov, Principio de Inclusión-Exclusión y partición del espacio muestral.
"""

from typing import Dict, Any, List, Tuple, Optional

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


def solve_one_event(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Resuelve el problema de un solo evento A.
    Calcula: P(A), P(Aᶜ), odds a favor, odds en contra y más.
    """
    input_mode  = data.get("input_mode", "probabilities")
    sample_space = float(data.get("sample_space", 100)) if data.get("sample_space") else 100.0
    names       = data.get("names", {})
    name_a      = names.get("A", "Evento A")

    steps: List[Dict[str, str]] = []

    if input_mode == "counts":
        count_a = float(data.get("count_a", 0))
        p_a = calc_simple_prob(count_a, sample_space)
        steps.append({
            "title": "Paso 1: Cálculo de la Probabilidad Simple (Regla de Laplace)",
            "formula": "P(A) = \\frac{|A|}{|S|}",
            "calculation": f"P({name_a}) = \\frac{{{count_a}}}{{{sample_space}}} = {p_a:.4f}",
            "explanation": "Dividimos el número de casos favorables entre el total de casos posibles del espacio muestral."
        })
    else:
        p_a = validate_prob_range(float(data.get("p_a", 0)), f"P({name_a})")
        steps.append({
            "title": "Paso 1: Identificación de la Probabilidad Simple",
            "formula": "0 \\le P(A) \\le 1",
            "calculation": f"P({name_a}) = {p_a:.4f}",
            "explanation": "La probabilidad ingresada cumple los axiomas de Kolmogorov."
        })

    p_not_a   = clamp_prob(1.0 - p_a)
    odds_fav  = round(p_a / p_not_a, 4) if p_not_a > 0 else float("inf")
    odds_con  = round(p_not_a / p_a, 4) if p_a > 0 else float("inf")

    steps.append({
        "title": "Paso 2: Probabilidad del Evento Complementario (Tercer Axioma)",
        "formula": "P(A^c) = 1 - P(A)",
        "calculation": f"P({name_a}^c) = 1 - {p_a:.4f} = {p_not_a:.4f}",
        "explanation": "El complemento de A contiene todos los resultados que NO pertenecen a A. La suma P(A)+P(Aᶜ)=1 siempre."
    })

    steps.append({
        "title": "Paso 3: Odds a Favor y en Contra del Evento",
        "formula": "Odds\\ a\\ favor = \\frac{P(A)}{P(A^c)}, \\quad Odds\\ en\\ contra = \\frac{P(A^c)}{P(A)}",
        "calculation": f"Odds\\ a\\ favor = \\frac{{{p_a:.4f}}}{{{p_not_a:.4f}}} = {odds_fav}, \\quad Odds\\ en\\ contra = {odds_con}",
        "explanation": "Los odds expresan la razón entre la probabilidad favorable y la desfavorable, útil en análisis de riesgo."
    })

    return {
        "status": "success",
        "num_events": 1,
        "sample_space_size": sample_space,
        "input_mode": input_mode,
        "typology": "Evento Simple",
        "typology_description": f"Se analiza el evento individual '{name_a}' con su probabilidad, complemento y odds.",
        "steps": steps,
        "probabilities": {
            f"P({name_a})":  p_a,
            f"P(Aᶜ)":       p_not_a,
            f"Odds a favor": odds_fav,
            f"Odds en contra": odds_con
        },
        "names": {"A": name_a},
        "regions": {},
        "venn_data": []
    }


def solve_two_events(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Resuelve el problema de 2 eventos (A y B).
    Entradas posibles:
      - p_a, p_b (o count_a, count_b con sample_space)
      - p_ab (intersección) O p_a_or_b (unión) O is_disjoint=True
    """
    input_mode = data.get("input_mode", "probabilities")
    sample_space = float(data.get("sample_space", 100)) if data.get("sample_space") is not None else 100.0
    names = data.get("names", {})
    name_a = names.get("A", "Evento A")
    name_b = names.get("B", "Evento B")
    is_disjoint = bool(data.get("is_disjoint", False))

    steps: List[Dict[str, str]] = []

    # 1. Obtención de P(A) y P(B)
    if input_mode == "counts":
        count_a = float(data.get("count_a", 0))
        count_b = float(data.get("count_b", 0))
        p_a = calc_simple_prob(count_a, sample_space)
        p_b = calc_simple_prob(count_b, sample_space)
        steps.append({
            "title": "Paso 1: Cálculo de probabilidades a partir de frecuencias (Regla de Laplace)",
            "formula": "P(E) = \\frac{|E|}{|S|}",
            "calculation": f"P({name_a}) = \\frac{{{count_a}}}{{{sample_space}}} = {p_a:.4f}, \\quad P({name_b}) = \\frac{{{count_b}}}{{{sample_space}}} = {p_b:.4f}",
            "explanation": "Calculamos la probabilidad clásica dividiendo los casos favorables entre el tamaño del espacio muestral."
        })
    else:
        p_a = validate_prob_range(float(data.get("p_a", 0)), f"P({name_a})")
        p_b = validate_prob_range(float(data.get("p_b", 0)), f"P({name_b})")
        steps.append({
            "title": "Paso 1: Identificación de probabilidades básicas",
            "formula": "0 \\le P(E) \\le 1",
            "calculation": f"P({name_a}) = {p_a:.4f}, \\quad P({name_b}) = {p_b:.4f}",
            "explanation": "Identificamos las probabilidades asignadas a los eventos individuales."
        })

    # 2. Tipología y cálculo de Intersección / Unión
    p_ab: Optional[float] = None
    p_union: Optional[float] = None

    if is_disjoint:
        p_ab = 0.0
        p_union = clamp_prob(p_a + p_b)
        typology = "Eventos Disjuntos (Mutuamente Excluyentes)"
        typology_desc = f"{name_a} y {name_b} no pueden ocurrir simultáneamente. Su intersección es el conjunto vacío (∅)."
        
        if p_union > 1.0 + EPSILON:
            raise AxiomViolationError(
                f"La suma de probabilidades de eventos disjuntos P({name_a}) + P({name_b}) = {p_a:.4f} + {p_b:.4f} = {p_union:.4f} supera 1.0 (100%), violando el axioma de aditividad finita.",
                code="DISJOINT_SUM_EXCEEDS_ONE"
            )

        steps.append({
            "title": "Paso 2: Análisis de tipología de eventos",
            "formula": "A \\cap B = \\emptyset \\implies P(A \\cap B) = 0",
            "calculation": f"P({name_a} \\cap {name_b}) = 0.0",
            "explanation": f"Dado que son mutuamente excluyentes, no comparten elementos y su probabilidad conjunta es cero."
        })
        steps.append({
            "title": "Paso 3: Axioma de aditividad para eventos disjuntos",
            "formula": "P(A \\cup B) = P(A) + P(B)",
            "calculation": f"P({name_a} \\cup {name_b}) = {p_a:.4f} + {p_b:.4f} = {p_union:.4f}",
            "explanation": "Para eventos disjuntos, la probabilidad de la unión es simplemente la suma directa de sus probabilidades."
        })

    else:
        # No se marcó como disjunto explícito
        raw_p_ab = data.get("p_ab")
        raw_count_ab = data.get("count_ab")
        raw_p_union = data.get("p_union")
        raw_count_union = data.get("count_union")

        if input_mode == "counts" and raw_count_ab is not None:
            p_ab = calc_simple_prob(float(raw_count_ab), sample_space)
        elif raw_p_ab is not None:
            p_ab = validate_prob_range(float(raw_p_ab), f"P({name_a} ∩ {name_b})")

        if input_mode == "counts" and raw_count_union is not None:
            p_union = calc_simple_prob(float(raw_count_union), sample_space)
        elif raw_p_union is not None:
            p_union = validate_prob_range(float(raw_p_union), f"P({name_a} ∪ {name_b})")

        if p_ab is not None and p_union is None:
            # Calcular unión a partir de la intersección
            p_union = clamp_prob(p_a + p_b - p_ab)
            steps.append({
                "title": "Paso 2: Aplicación de la Regla General de la Adición (Inclusión-Exclusión)",
                "formula": "P(A \\cup B) = P(A) + P(B) - P(A \\cap B)",
                "calculation": f"P({name_a} \\cup {name_b}) = {p_a:.4f} + {p_b:.4f} - {p_ab:.4f} = {p_union:.4f}",
                "explanation": "Restamos la intersección una vez para evitar contar dos veces los elementos compartidos."
            })
        elif p_union is not None and p_ab is None:
            # Despejar intersección a partir de la unión
            calc_ab = p_a + p_b - p_union
            if calc_ab < -EPSILON:
                raise AxiomViolationError(
                    f"La intersección deducida P({name_a} ∩ {name_b}) = P({name_a}) + P({name_b}) - P({name_a} ∪ {name_b}) = {p_a:.4f} + {p_b:.4f} - {p_union:.4f} = {calc_ab:.4f} resulta negativa. Los datos de entrada son inconsistentes (la unión no puede ser mayor que la suma de las partes).",
                    code="NEGATIVE_INTERSECTION"
                )
            p_ab = clamp_prob(calc_ab)
            steps.append({
                "title": "Paso 2: Deducción algebraica de la Intersección",
                "formula": "P(A \\cap B) = P(A) + P(B) - P(A \\cup B)",
                "calculation": f"P({name_a} \\cap {name_b}) = {p_a:.4f} + {p_b:.4f} - {p_union:.4f} = {p_ab:.4f}",
                "explanation": "Despejamos la intersección a partir del Principio de Inclusión-Exclusión."
            })
        elif p_ab is not None and p_union is not None:
            # Ambos proporcionados: validar consistencia
            expected_union = clamp_prob(p_a + p_b - p_ab)
            if abs(p_union - expected_union) > 1e-4:
                raise AxiomViolationError(
                    f"Inconsistencia en los datos: P({name_a} ∪ {name_b}) ingresado es {p_union:.4f}, pero según la regla de adición P({name_a}) + P({name_b}) - P({name_a} ∩ {name_b}) debería ser {expected_union:.4f}.",
                    code="UNION_INTERSECTION_MISMATCH"
                )
            steps.append({
                "title": "Paso 2: Verificación de consistencia del Principio de Inclusión-Exclusión",
                "formula": "P(A \\cup B) = P(A) + P(B) - P(A \\cap B)",
                "calculation": f"{p_union:.4f} = {p_a:.4f} + {p_b:.4f} - {p_ab:.4f} \\quad \\checkmark",
                "explanation": "Los valores ingresados satisfacen rigurosamente la regla general de la adición."
            })
        else:
            raise AxiomViolationError(
                "Debe proporcionar al menos la probabilidad/conteo de la Intersección (A ∩ B), de la Unión (A ∪ B) o marcar los eventos como Disjuntos.",
                code="MISSING_DATA"
            )

        if p_ab == 0.0:
            typology = "Eventos Disjuntos (Mutuamente Excluyentes)"
            typology_desc = f"{name_a} y {name_b} no comparten elementos (P(A ∩ B) = 0)."
        else:
            typology = "Eventos Intersecantes (Compatibles)"
            typology_desc = f"{name_a} y {name_b} son compatibles y pueden ocurrir simultáneamente con P(A ∩ B) = {p_ab:.4f}."

    # Validaciones axiomáticas estrictas
    if p_ab > p_a + EPSILON or p_ab > p_b + EPSILON:
        raise AxiomViolationError(
            f"La intersección P({name_a} ∩ {name_b}) = {p_ab:.4f} no puede ser mayor que las probabilidades individuales (P({name_a})={p_a:.4f}, P({name_b})={p_b:.4f}). Un subconjunto intersección no puede superar a los conjuntos que lo contienen.",
            code="INTERSECTION_EXCEEDS_EVENT"
        )

    if p_union > 1.0 + EPSILON:
        raise AxiomViolationError(
            f"La probabilidad de la unión P({name_a} ∪ {name_b}) = {p_union:.4f} supera 1.0 (100%), violando el segundo axioma de Kolmogorov.",
            code="UNION_EXCEEDS_ONE"
        )

    # 3. Partición del espacio muestral en regiones mutuamente excluyentes
    only_a = clamp_prob(p_a - p_ab)
    only_b = clamp_prob(p_b - p_ab)
    neither = clamp_prob(1.0 - p_union)

    if only_a < -EPSILON:
        raise AxiomViolationError(f"La región 'Solo {name_a}' resultó negativa ({only_a:.4f}).", code="NEGATIVE_REGION")
    if only_b < -EPSILON:
        raise AxiomViolationError(f"La región 'Solo {name_b}' resultó negativa ({only_b:.4f}).", code="NEGATIVE_REGION")
    if neither < -EPSILON:
        raise AxiomViolationError(f"La región exterior '(A ∪ B)^c' resultó negativa ({neither:.4f}).", code="NEGATIVE_REGION")

    steps.append({
        "title": "Paso 3: Descomposición en Regiones Mutuamente Excluyentes (Partición de Venn)",
        "formula": "P(Solo\\ A) = P(A) - P(A \\cap B), \\quad P(Solo\\ B) = P(B) - P(A \\cap B), \\quad P(Ninguno) = 1 - P(A \\cup B)",
        "calculation": (
            f"P(Solo\\ {name_a}) = {p_a:.4f} - {p_ab:.4f} = {only_a:.4f} \\\\\n"
            f"P(Solo\\ {name_b}) = {p_b:.4f} - {p_ab:.4f} = {only_b:.4f} \\\\\n"
            f"P(A \\cap B) = {p_ab:.4f} \\\\\n"
            f"P((A \\cup B)^c) = 1 - {p_union:.4f} = {neither:.4f}"
        ),
        "explanation": "Calculamos las probabilidades de las cuatro áreas disjuntas que conforman el diagrama de Venn."
    })

    # 4. Probabilidades Condicionales y Complementos
    p_a_given_b = clamp_prob(p_ab / p_b) if p_b > 0 else 0.0
    p_b_given_a = clamp_prob(p_ab / p_a) if p_a > 0 else 0.0
    p_not_a = clamp_prob(1.0 - p_a)
    p_not_b = clamp_prob(1.0 - p_b)

    cond_calc_str = ""
    if p_b > 0:
        cond_calc_str += f"P({name_a} | {name_b}) = \\frac{{{p_ab:.4f}}}{{{p_b:.4f}}} = {p_a_given_b:.4f}"
    else:
        cond_calc_str += f"P({name_a} | {name_b}) \\text{{ indefinido (P(B)=0)}}"

    if p_a > 0:
        cond_calc_str += f", \\quad P({name_b} | {name_a}) = \\frac{{{p_ab:.4f}}}{{{p_a:.4f}}} = {p_b_given_a:.4f}"
    else:
        cond_calc_str += f", \\quad P({name_b} | {name_a}) \\text{{ indefinido (P(A)=0)}}"

    steps.append({
        "title": "Paso 4: Métricas estadísticas complementarias y condicionales",
        "formula": "P(A|B) = \\frac{P(A \\cap B)}{P(B)}, \\quad P(A^c) = 1 - P(A)",
        "calculation": cond_calc_str + f" \\\\\nP({name_a}^c) = {p_not_a:.4f}, \\quad P({name_b}^c) = {p_not_b:.4f}",
        "explanation": "Calculamos la probabilidad condicional bajo la definición de Kolmogorov y las probabilidades complementarias."
    })

    # Preparar datos para Venn.js
    # Venn.js toma los tamaños totales de cada conjunto e intersección
    # Para evitar que números muy pequeños distorsionen el renderizado visual,
    # usamos un escalado base (por ejemplo porcentajes o conteos).
    size_a = round(p_a * sample_space, 4) if input_mode == "counts" else round(p_a * 100, 2)
    size_b = round(p_b * sample_space, 4) if input_mode == "counts" else round(p_b * 100, 2)
    size_ab = round(p_ab * sample_space, 4) if input_mode == "counts" else round(p_ab * 100, 2)

    venn_data = [
        {"sets": [name_a], "size": max(size_a, 0.001)},
        {"sets": [name_b], "size": max(size_b, 0.001)},
        {"sets": [name_a, name_b], "size": size_ab}
    ]

    regions = {
        "only_a": {
            "name": f"Solo {name_a}",
            "notation": f"{name_a} \\ {name_b}",
            "prob": only_a,
            "percentage": f"{only_a * 100:.2f}%",
            "count": round(only_a * sample_space, 2)
        },
        "only_b": {
            "name": f"Solo {name_b}",
            "notation": f"{name_b} \\ {name_a}",
            "prob": only_b,
            "percentage": f"{only_b * 100:.2f}%",
            "count": round(only_b * sample_space, 2)
        },
        "intersection_ab": {
            "name": f"Intersección {name_a} y {name_b}",
            "notation": f"{name_a} ∩ {name_b}",
            "prob": p_ab,
            "percentage": f"{p_ab * 100:.2f}%",
            "count": round(p_ab * sample_space, 2)
        },
        "neither": {
            "name": "Ninguno (Exterior)",
            "notation": f"({name_a} ∪ {name_b})^c",
            "prob": neither,
            "percentage": f"{neither * 100:.2f}%",
            "count": round(neither * sample_space, 2)
        }
    }

    return {
        "status": "success",
        "num_events": 2,
        "sample_space_size": sample_space,
        "input_mode": input_mode,
        "typology": typology,
        "typology_description": typology_desc,
        "steps": steps,
        "probabilities": {
            f"P({name_a})": p_a,
            f"P({name_b})": p_b,
            f"P({name_a} ∩ {name_b})": p_ab,
            f"P({name_a} ∪ {name_b})": p_union,
            f"P({name_a}|{name_b})": p_a_given_b,
            f"P({name_b}|{name_a})": p_b_given_a,
            f"P({name_a}^c)": p_not_a,
            f"P({name_b}^c)": p_not_b
        },
        "names": {"A": name_a, "B": name_b},
        "regions": regions,
        "venn_data": venn_data
    }


def solve_three_events(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Resuelve el problema de 3 eventos (A, B y C).
    Implementa el principio de inclusión-exclusión:
      P(A ∪ B ∪ C) = P(A) + P(B) + P(C) - P(AB) - P(AC) - P(BC) + P(ABC)
    Y calcula la partición de las 8 regiones disjuntas.
    """
    input_mode = data.get("input_mode", "probabilities")
    sample_space = float(data.get("sample_space", 100)) if data.get("sample_space") is not None else 100.0
    names = data.get("names", {})
    name_a = names.get("A", "Evento A")
    name_b = names.get("B", "Evento B")
    name_c = names.get("C", "Evento C")

    steps: List[Dict[str, str]] = []

    def get_val(key_p: str, key_cnt: str, name_label: str) -> float:
        if input_mode == "counts":
            val = data.get(key_cnt)
            if val is None:
                raise AxiomViolationError(f"Falta el conteo para {name_label}.", code="MISSING_DATA")
            return calc_simple_prob(float(val), sample_space)
        else:
            val = data.get(key_p)
            if val is None:
                raise AxiomViolationError(f"Falta la probabilidad para {name_label}.", code="MISSING_DATA")
            return validate_prob_range(float(val), name_label)

    # 1. Eventos simples
    p_a = get_val("p_a", "count_a", f"P({name_a})")
    p_b = get_val("p_b", "count_b", f"P({name_b})")
    p_c = get_val("p_c", "count_c", f"P({name_c})")

    steps.append({
        "title": "Paso 1: Probabilidades de eventos individuales",
        "formula": "0 \\le P(E) \\le 1",
        "calculation": f"P({name_a}) = {p_a:.4f}, \\quad P({name_b}) = {p_b:.4f}, \\quad P({name_c}) = {p_c:.4f}",
        "explanation": "Se identifican o normalizan las probabilidades individuales de cada evento."
    })

    # 2. Intersecciones dobles
    p_ab = get_val("p_ab", "count_ab", f"P({name_a} ∩ {name_b})")
    p_ac = get_val("p_ac", "count_ac", f"P({name_a} ∩ {name_c})")
    p_bc = get_val("p_bc", "count_bc", f"P({name_b} ∩ {name_c})")

    # Validación de pares
    for (p_inter, e1, e2, name_pair) in [
        (p_ab, p_a, p_b, f"{name_a} y {name_b}"),
        (p_ac, p_a, p_c, f"{name_a} y {name_c}"),
        (p_bc, p_b, p_c, f"{name_b} y {name_c}")
    ]:
        if p_inter > e1 + EPSILON or p_inter > e2 + EPSILON:
            raise AxiomViolationError(
                f"La intersección doble P({name_pair}) = {p_inter:.4f} no puede ser mayor que ninguna de las probabilidades individuales involucradas.",
                code="INTERSECTION_EXCEEDS_EVENT"
            )

    steps.append({
        "title": "Paso 2: Intersecciones dobles (Interacciones por pares)",
        "formula": "P(E_i \\cap E_j) \\le \\min(P(E_i), P(E_j))",
        "calculation": f"P({name_a} \\cap {name_b}) = {p_ab:.4f}, \\quad P({name_a} \\cap {name_c}) = {p_ac:.4f}, \\quad P({name_b} \\cap {name_c}) = {p_bc:.4f}",
        "explanation": "Se verifican las probabilidades de intersección entre cada par de eventos."
    })

    # 3. Intersección Triple o Unión Total
    p_abc: Optional[float] = None
    p_union: Optional[float] = None

    raw_p_abc = data.get("p_abc")
    raw_cnt_abc = data.get("count_abc")
    raw_p_union = data.get("p_union")
    raw_cnt_union = data.get("count_union")

    if input_mode == "counts" and raw_cnt_abc is not None:
        p_abc = calc_simple_prob(float(raw_cnt_abc), sample_space)
    elif raw_p_abc is not None:
        p_abc = validate_prob_range(float(raw_p_abc), f"P({name_a} ∩ {name_b} ∩ {name_c})")

    if input_mode == "counts" and raw_cnt_union is not None:
        p_union = calc_simple_prob(float(raw_cnt_union), sample_space)
    elif raw_p_union is not None:
        p_union = validate_prob_range(float(raw_p_union), f"P({name_a} ∪ {name_b} ∪ {name_c})")

    if p_abc is not None and p_union is None:
        # Calcular unión a partir del principio de inclusión-exclusión
        calc_union = p_a + p_b + p_c - p_ab - p_ac - p_bc + p_abc
        p_union = clamp_prob(calc_union)
        steps.append({
            "title": "Paso 3: Cálculo de la Unión Total P(A ∪ B ∪ C) mediante Inclusión-Exclusión",
            "formula": "P(A \\cup B \\cup C) = P(A) + P(B) + P(C) - P(A \\cap B) - P(A \\cap C) - P(B \\cap C) + P(A \\cap B \\cap C)",
            "calculation": (
                f"P({name_a} \\cup {name_b} \\cup {name_c}) = {p_a:.4f} + {p_b:.4f} + {p_c:.4f} "
                f"- {p_ab:.4f} - {p_ac:.4f} - {p_bc:.4f} + {p_abc:.4f} = {p_union:.4f}"
            ),
            "explanation": "Sumamos los conjuntos individuales, restamos las intersecciones dobles para evitar sobreconteo, y sumamos de vuelta la intersección triple."
        })
    elif p_union is not None and p_abc is None:
        # Deducción de la intersección triple exacta basada en la fórmula:
        # P(A ∩ B ∩ C) = P(A ∪ B ∪ C) + P(A ∩ B) + P(A ∩ C) + P(B ∩ C) - P(A) - P(B) - P(C)
        calc_abc = p_union + p_ab + p_ac + p_bc - p_a - p_b - p_c
        if calc_abc < -EPSILON:
            raise AxiomViolationError(
                f"La intersección triple calculada P({name_a} ∩ {name_b} ∩ {name_c}) = {calc_abc:.4f} es estrictamente negativa. Esto demuestra inconsistencia axiomática en los datos proporcionados (la unión no puede cubrir de esa forma las intersecciones).",
                code="NEGATIVE_TRIPLE_INTERSECTION"
            )
        p_abc = clamp_prob(calc_abc)
        steps.append({
            "title": "Paso 3: Deducción de la Intersección Triple Exacta P(A ∩ B ∩ C)",
            "formula": "P(A \\cap B \\cap C) = P(A \\cup B \\cup C) + P(A \\cap B) + P(A \\cap C) + P(B \\cap C) - P(A) - P(B) - P(C)",
            "calculation": (
                f"P({name_a} \\cap {name_b} \\cap {name_c}) = {p_union:.4f} + {p_ab:.4f} + {p_ac:.4f} + {p_bc:.4f} "
                f"- {p_a:.4f} - {p_b:.4f} - {p_c:.4f} = {p_abc:.4f}"
            ),
            "explanation": "Despejamos algebraicamente la intersección triple a partir de la fórmula de Poincaré de Inclusión-Exclusión."
        })
    elif p_abc is not None and p_union is not None:
        expected_union = clamp_prob(p_a + p_b + p_c - p_ab - p_ac - p_bc + p_abc)
        if abs(p_union - expected_union) > 1e-4:
            raise AxiomViolationError(
                f"Inconsistencia en los datos: La unión P(A ∪ B ∪ C) suministrada ({p_union:.4f}) no concuerda con la unión calculada ({expected_union:.4f}) a partir de las intersecciones y la triple intersección.",
                code="TRIPLE_UNION_MISMATCH"
            )
        steps.append({
            "title": "Paso 3: Verificación de Inclusión-Exclusión de 3 Eventos",
            "formula": "P(A \\cup B \\cup C) = P(A) + P(B) + P(C) - P(AB) - P(AC) - P(BC) + P(ABC)",
            "calculation": f"{p_union:.4f} = {expected_union:.4f} \\quad \\checkmark",
            "explanation": "Los valores suministrados son consistentes con el Principio de Inclusión-Exclusión."
        })
    else:
        raise AxiomViolationError(
            "Para 3 eventos, debe proporcionar la Intersección Triple (A ∩ B ∩ C) O la Unión Total (A ∪ B ∪ C).",
            code="MISSING_DATA"
        )

    # Validaciones axiomáticas sobre P(ABC) y Unión
    min_pairwise = min(p_ab, p_ac, p_bc)
    if p_abc > min_pairwise + EPSILON:
        raise AxiomViolationError(
            f"La intersección triple P({name_a} ∩ {name_b} ∩ {name_c}) = {p_abc:.4f} supera una de las intersecciones dobles (mínimo = {min_pairwise:.4f}). Esto viola el principio de inclusión de subconjuntos.",
            code="TRIPLE_EXCEEDS_DOUBLE"
        )

    if p_union > 1.0 + EPSILON:
        raise AxiomViolationError(
            f"La unión total P({name_a} ∪ {name_b} ∪ {name_c}) = {p_union:.4f} supera 1.0 (100%), violando el segundo axioma de Kolmogorov.",
            code="UNION_EXCEEDS_ONE"
        )

    # 4. Partición en las 8 regiones disjuntas de Venn
    # Intersecciones dobles exclusivas (solo entre 2 de ellos)
    only_ab = clamp_prob(p_ab - p_abc)
    only_ac = clamp_prob(p_ac - p_abc)
    only_bc = clamp_prob(p_bc - p_abc)

    # Regiones exclusivas individuales:
    # "Solo A" = P(A) - P(AB) - P(AC) + P(ABC)
    only_a = clamp_prob(p_a - p_ab - p_ac + p_abc)
    only_b = clamp_prob(p_b - p_ab - p_bc + p_abc)
    only_c = clamp_prob(p_c - p_ac - p_bc + p_abc)

    neither = clamp_prob(1.0 - p_union)

    # Validación de no-negatividad de cada región
    region_checks = [
        ("Solo " + name_a, only_a),
        ("Solo " + name_b, only_b),
        ("Solo " + name_c, only_c),
        (f"Solo {name_a} y {name_b}", only_ab),
        (f"Solo {name_a} y {name_c}", only_ac),
        (f"Solo {name_b} y {name_c}", only_bc),
        ("Intersección triple", p_abc),
        ("Exterior (Ninguno)", neither)
    ]

    for reg_name, reg_val in region_checks:
        if reg_val < -EPSILON:
            raise AxiomViolationError(
                f"Inconsistencia matemática: La región '{reg_name}' resulta en una probabilidad negativa ({reg_val:.4f} < 0), lo que viola el primer axioma de Kolmogorov (no negatividad). Por favor verifica los datos ingresados.",
                code="NEGATIVE_REGION"
            )

    steps.append({
        "title": "Paso 4: Cálculo de Regiones Mutuamente Excluyentes (Partición de Venn)",
        "formula": "P(Solo\\ A) = P(A) - P(AB) - P(AC) + P(ABC), \\quad P(Solo\\ AB) = P(AB) - P(ABC)",
        "calculation": (
            f"P(Solo\\ {name_a}) = {p_a:.4f} - {p_ab:.4f} - {p_ac:.4f} + {p_abc:.4f} = {only_a:.4f} \\\\\n"
            f"P(Solo\\ {name_b}) = {p_b:.4f} - {p_ab:.4f} - {p_bc:.4f} + {p_abc:.4f} = {only_b:.4f} \\\\\n"
            f"P(Solo\\ {name_c}) = {p_c:.4f} - {p_ac:.4f} - {p_bc:.4f} + {p_abc:.4f} = {only_c:.4f} \\\\\n"
            f"P(Solo\\ {name_a} \\cap {name_b}) = {p_ab:.4f} - {p_abc:.4f} = {only_ab:.4f} \\\\\n"
            f"P(Solo\\ {name_a} \\cap {name_c}) = {p_ac:.4f} - {p_abc:.4f} = {only_ac:.4f} \\\\\n"
            f"P(Solo\\ {name_b} \\cap {name_c}) = {p_bc:.4f} - {p_abc:.4f} = {only_bc:.4f} \\\\\n"
            f"P({name_a} \\cap {name_b} \\cap {name_c}) = {p_abc:.4f} \\\\\n"
            f"P(Ninguno) = 1 - {p_union:.4f} = {neither:.4f}"
        ),
        "explanation": "Particionamos el espacio muestral en 8 componentes mutuamente excluyentes cuya suma es exactamente 1.0 (100%)."
    })

    # Tipología
    all_intersections_zero = (p_ab == 0 and p_ac == 0 and p_bc == 0 and p_abc == 0)
    if all_intersections_zero:
        typology = "Eventos Mutuamente Excluyentes (Disjuntos 3 a 3)"
        typology_desc = "Ninguno de los 3 eventos comparte elementos entre sí."
    elif p_abc > 0:
        typology = "Eventos Concurrentes (Intersección Triple Activa)"
        typology_desc = f"Existe una región común compartida por los 3 eventos con P(A ∩ B ∩ C) = {p_abc:.4f}."
    else:
        typology = "Eventos Parcialmente Intersecantes (Sin Intersección Triple)"
        typology_desc = "Existen intersecciones entre pares de eventos, pero los 3 no ocurren de manera simultánea."

    # Datos para Venn.js
    # Venn.js requiere los tamaños acumulados de cada conjunto e intersección
    factor = sample_space if input_mode == "counts" else 100.0
    venn_data = [
        {"sets": [name_a], "size": max(round(p_a * factor, 4), 0.001)},
        {"sets": [name_b], "size": max(round(p_b * factor, 4), 0.001)},
        {"sets": [name_c], "size": max(round(p_c * factor, 4), 0.001)},
        {"sets": [name_a, name_b], "size": round(p_ab * factor, 4)},
        {"sets": [name_a, name_c], "size": round(p_ac * factor, 4)},
        {"sets": [name_b, name_c], "size": round(p_bc * factor, 4)},
        {"sets": [name_a, name_b, name_c], "size": round(p_abc * factor, 4)}
    ]

    regions = {
        "only_a": {
            "name": f"Solo {name_a}",
            "notation": f"{name_a} \\ ({name_b} ∪ {name_c})",
            "prob": only_a,
            "percentage": f"{only_a * 100:.2f}%",
            "count": round(only_a * sample_space, 2)
        },
        "only_b": {
            "name": f"Solo {name_b}",
            "notation": f"{name_b} \\ ({name_a} ∪ {name_c})",
            "prob": only_b,
            "percentage": f"{only_b * 100:.2f}%",
            "count": round(only_b * sample_space, 2)
        },
        "only_c": {
            "name": f"Solo {name_c}",
            "notation": f"{name_c} \\ ({name_a} ∪ {name_b})",
            "prob": only_c,
            "percentage": f"{only_c * 100:.2f}%",
            "count": round(only_c * sample_space, 2)
        },
        "only_ab": {
            "name": f"Solo {name_a} y {name_b}",
            "notation": f"({name_a} ∩ {name_b}) \\ {name_c}",
            "prob": only_ab,
            "percentage": f"{only_ab * 100:.2f}%",
            "count": round(only_ab * sample_space, 2)
        },
        "only_ac": {
            "name": f"Solo {name_a} y {name_c}",
            "notation": f"({name_a} ∩ {name_c}) \\ {name_b}",
            "prob": only_ac,
            "percentage": f"{only_ac * 100:.2f}%",
            "count": round(only_ac * sample_space, 2)
        },
        "only_bc": {
            "name": f"Solo {name_b} y {name_c}",
            "notation": f"({name_b} ∩ {name_c}) \\ {name_a}",
            "prob": only_bc,
            "percentage": f"{only_bc * 100:.2f}%",
            "count": round(only_bc * sample_space, 2)
        },
        "intersection_abc": {
            "name": f"Intersección {name_a}, {name_b} y {name_c}",
            "notation": f"{name_a} ∩ {name_b} ∩ {name_c}",
            "prob": p_abc,
            "percentage": f"{p_abc * 100:.2f}%",
            "count": round(p_abc * sample_space, 2)
        },
        "neither": {
            "name": "Exterior (Ninguno)",
            "notation": f"({name_a} ∪ {name_b} ∪ {name_c})^c",
            "prob": neither,
            "percentage": f"{neither * 100:.2f}%",
            "count": round(neither * sample_space, 2)
        }
    }

    return {
        "status": "success",
        "num_events": 3,
        "sample_space_size": sample_space,
        "input_mode": input_mode,
        "typology": typology,
        "typology_description": typology_desc,
        "steps": steps,
        "probabilities": {
            f"P({name_a})": p_a,
            f"P({name_b})": p_b,
            f"P({name_c})": p_c,
            f"P({name_a} ∩ {name_b})": p_ab,
            f"P({name_a} ∩ {name_c})": p_ac,
            f"P({name_b} ∩ {name_c})": p_bc,
            f"P({name_a} ∩ {name_b} ∩ {name_c})": p_abc,
            f"P({name_a} ∪ {name_b} ∪ {name_c})": p_union
        },
        "names": {"A": name_a, "B": name_b, "C": name_c},
        "regions": regions,
        "venn_data": venn_data
    }
