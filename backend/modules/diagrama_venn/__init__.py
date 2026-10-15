"""
Módulo de Diagramas de Venn y Partición del Espacio Muestral.
Proporciona cálculos de particiones disjuntas y regiones para 2 y 3 conjuntos.
"""

from .partitions import (
    calculate_venn_partitions_2,
    calculate_venn_partitions_3,
)

__all__ = [
    "calculate_venn_partitions_2",
    "calculate_venn_partitions_3",
]
