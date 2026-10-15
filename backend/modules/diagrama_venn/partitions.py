"""
partitions.py - Partición del espacio muestral en regiones disjuntas para diagramas de Venn.
Proporciona utilidades para el cálculo de subconjuntos excluyentes (2 y 3 conjuntos)
y formateo de datos para visualización geométrica con D3 y Venn.js.
"""

from typing import Dict, Any, List


def calculate_venn_partitions_2(
    p_a: float,
    p_b: float,
    p_ab: float,
    sample_space: float = 100.0,
    names: Dict[str, str] = None
) -> Dict[str, Any]:
    """Calcula las 4 regiones mutuamente excluyentes para 2 eventos."""
    names = names or {"A": "A", "B": "B"}
    name_a = names.get("A", "A")
    name_b = names.get("B", "B")

    only_a = max(0.0, round(p_a - p_ab, 6))
    only_b = max(0.0, round(p_b - p_ab, 6))
    p_union = max(0.0, round(p_a + p_b - p_ab, 6))
    neither = max(0.0, round(1.0 - p_union, 6))

    return {
        "only_a": {"name": f"Solo {name_a}", "prob": only_a, "count": round(only_a * sample_space, 2)},
        "only_b": {"name": f"Solo {name_b}", "prob": only_b, "count": round(only_b * sample_space, 2)},
        "intersection_ab": {"name": f"{name_a} ∩ {name_b}", "prob": p_ab, "count": round(p_ab * sample_space, 2)},
        "neither": {"name": "Ninguno (Exterior)", "prob": neither, "count": round(neither * sample_space, 2)},
    }


def calculate_venn_partitions_3(
    p_a: float,
    p_b: float,
    p_c: float,
    p_ab: float,
    p_ac: float,
    p_bc: float,
    p_abc: float,
    sample_space: float = 100.0,
    names: Dict[str, str] = None
) -> Dict[str, Any]:
    """Calcula las 8 regiones mutuamente excluyentes para 3 eventos."""
    names = names or {"A": "A", "B": "B", "C": "C"}
    name_a = names.get("A", "A")
    name_b = names.get("B", "B")
    name_c = names.get("C", "C")

    only_ab = max(0.0, round(p_ab - p_abc, 6))
    only_ac = max(0.0, round(p_ac - p_abc, 6))
    only_bc = max(0.0, round(p_bc - p_abc, 6))

    only_a = max(0.0, round(p_a - p_ab - p_ac + p_abc, 6))
    only_b = max(0.0, round(p_b - p_ab - p_bc + p_abc, 6))
    only_c = max(0.0, round(p_c - p_ac - p_bc + p_abc, 6))

    p_union = max(0.0, round(p_a + p_b + p_c - p_ab - p_ac - p_bc + p_abc, 6))
    neither = max(0.0, round(1.0 - p_union, 6))

    return {
        "only_a": {"name": f"Solo {name_a}", "prob": only_a, "count": round(only_a * sample_space, 2)},
        "only_b": {"name": f"Solo {name_b}", "prob": only_b, "count": round(only_b * sample_space, 2)},
        "only_c": {"name": f"Solo {name_c}", "prob": only_c, "count": round(only_c * sample_space, 2)},
        "only_ab": {"name": f"Solo {name_a} ∩ {name_b}", "prob": only_ab, "count": round(only_ab * sample_space, 2)},
        "only_ac": {"name": f"Solo {name_a} ∩ {name_c}", "prob": only_ac, "count": round(only_ac * sample_space, 2)},
        "only_bc": {"name": f"Solo {name_b} ∩ {name_c}", "prob": only_bc, "count": round(only_bc * sample_space, 2)},
        "intersection_abc": {"name": f"{name_a} ∩ {name_b} ∩ {name_c}", "prob": p_abc, "count": round(p_abc * sample_space, 2)},
        "neither": {"name": "Exterior (Ninguno)", "prob": neither, "count": round(neither * sample_space, 2)},
    }
