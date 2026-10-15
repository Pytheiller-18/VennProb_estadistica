import sys
import unittest
sys.path.insert(0, ".")

from backend.modules.espacio_muestral import (
    solve_one_event,
    solve_two_events,
    solve_three_events,
    calc_simple_prob,
    AxiomViolationError
)
from backend.modules.calculadora import (
    factorial,
    nPr,
    nCr,
    to_fraction,
    safe_eval
)
from backend.modules.diagrama_venn import (
    calculate_venn_partitions_2,
    calculate_venn_partitions_3
)


class TestModules(unittest.TestCase):
    def test_espacio_muestral_solver_1(self):
        res = solve_one_event({"p_a": 0.4, "names": {"A": "Prueba"}})
        self.assertEqual(res["status"], "success")
        self.assertAlmostEqual(res["probabilities"]["P(Prueba)"], 0.4)
        self.assertAlmostEqual(res["probabilities"]["P(Aᶜ)"], 0.6)

    def test_calculadora_combinatorics(self):
        self.assertEqual(factorial(5), 120)
        self.assertEqual(nPr(5, 2), 20)
        self.assertEqual(nCr(5, 2), 10)
        frac = to_fraction(0.75)
        self.assertEqual(frac["numerator"], 3)
        self.assertEqual(frac["denominator"], 4)

    def test_calculadora_safe_eval(self):
        res = safe_eval("sin(30)", angle_mode="DEG")
        self.assertAlmostEqual(res, 0.5, places=5)
        res_rad = safe_eval("cos(pi)", angle_mode="RAD")
        self.assertAlmostEqual(res_rad, -1.0, places=5)
        res_comb = safe_eval("nCr(6, 2) + nPr(4, 2)")
        self.assertEqual(res_comb, 15 + 12)

    def test_diagrama_venn_partitions(self):
        parts2 = calculate_venn_partitions_2(0.6, 0.5, 0.3)
        self.assertAlmostEqual(parts2["only_a"]["prob"], 0.3)
        self.assertAlmostEqual(parts2["only_b"]["prob"], 0.2)
        self.assertAlmostEqual(parts2["neither"]["prob"], 0.2)

        parts3 = calculate_venn_partitions_3(0.5, 0.4, 0.35, 0.2, 0.15, 0.12, 0.06)
        self.assertAlmostEqual(parts3["intersection_abc"]["prob"], 0.06)
        self.assertAlmostEqual(parts3["only_ab"]["prob"], 0.14)


if __name__ == "__main__":
    unittest.main()
