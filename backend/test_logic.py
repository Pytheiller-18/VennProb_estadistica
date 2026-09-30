import sys
import unittest
sys.path.insert(0, ".")
from backend.logic import solve_two_events, solve_three_events, calc_simple_prob, AxiomViolationError

class TestLogic(unittest.TestCase):
    def test_simple_prob(self):
        self.assertEqual(calc_simple_prob(25, 100), 0.25)
        self.assertEqual(calc_simple_prob(0, 100), 0.0)
        self.assertEqual(calc_simple_prob(100, 100), 1.0)
        with self.assertRaises(AxiomViolationError):
            calc_simple_prob(-5, 100)
        with self.assertRaises(AxiomViolationError):
            calc_simple_prob(150, 100)
        with self.assertRaises(AxiomViolationError):
            calc_simple_prob(10, 0)

    def test_two_events_intersecting(self):
        data = {
            "input_mode": "probabilities",
            "p_a": 0.6,
            "p_b": 0.5,
            "p_ab": 0.3
        }
        res = solve_two_events(data)
        self.assertEqual(res["status"], "success")
        self.assertAlmostEqual(res["probabilities"]["P(Evento A ∪ Evento B)"], 0.8)
        self.assertAlmostEqual(res["regions"]["only_a"]["prob"], 0.3)
        self.assertAlmostEqual(res["regions"]["only_b"]["prob"], 0.2)
        self.assertAlmostEqual(res["regions"]["intersection_ab"]["prob"], 0.3)
        self.assertAlmostEqual(res["regions"]["neither"]["prob"], 0.2)
        self.assertIn("Intersecantes", res["typology"])

    def test_two_events_union_provided(self):
        # Deduction of intersection: P(AB) = 0.5 + 0.4 - 0.7 = 0.2
        data = {
            "input_mode": "probabilities",
            "p_a": 0.5,
            "p_b": 0.4,
            "p_union": 0.7
        }
        res = solve_two_events(data)
        self.assertAlmostEqual(res["probabilities"]["P(Evento A ∩ Evento B)"], 0.2)

    def test_two_events_disjoint(self):
        data = {
            "input_mode": "probabilities",
            "p_a": 0.3,
            "p_b": 0.4,
            "is_disjoint": True
        }
        res = solve_two_events(data)
        self.assertAlmostEqual(res["probabilities"]["P(Evento A ∩ Evento B)"], 0.0)
        self.assertAlmostEqual(res["probabilities"]["P(Evento A ∪ Evento B)"], 0.7)
        self.assertIn("Disjuntos", res["typology"])

    def test_two_events_disjoint_exceeds_one(self):
        data = {
            "input_mode": "probabilities",
            "p_a": 0.6,
            "p_b": 0.5,
            "is_disjoint": True
        }
        with self.assertRaises(AxiomViolationError):
            solve_two_events(data)

    def test_two_events_negative_intersection(self):
        # P(A) = 0.2, P(B) = 0.3, Union = 0.7 -> P(AB) = 0.2 + 0.3 - 0.7 = -0.2 < 0!
        data = {
            "input_mode": "probabilities",
            "p_a": 0.2,
            "p_b": 0.3,
            "p_union": 0.7
        }
        with self.assertRaises(AxiomViolationError):
            solve_two_events(data)

    def test_three_events_deduce_triple(self):
        # P(A)=0.5, P(B)=0.4, P(C)=0.4
        # P(AB)=0.2, P(AC)=0.15, P(BC)=0.15
        # P(Union)=0.8
        # P(ABC) = 0.8 + 0.2 + 0.15 + 0.15 - 0.5 - 0.4 - 0.4 = 1.30 - 1.30 = 0.00
        data = {
            "input_mode": "probabilities",
            "p_a": 0.5,
            "p_b": 0.4,
            "p_c": 0.4,
            "p_ab": 0.2,
            "p_ac": 0.15,
            "p_bc": 0.15,
            "p_union": 0.8
        }
        res = solve_three_events(data)
        self.assertEqual(res["status"], "success")
        self.assertAlmostEqual(res["probabilities"]["P(Evento A ∩ Evento B ∩ Evento C)"], 0.0)

    def test_three_events_active_triple(self):
        # Classical problem:
        # P(A)=0.50, P(B)=0.40, P(C)=0.35
        # P(AB)=0.20, P(AC)=0.15, P(BC)=0.12
        # P(ABC)=0.05
        # Union = 0.50 + 0.40 + 0.35 - 0.20 - 0.15 - 0.12 + 0.05 = 0.83
        # Solo A = 0.50 - 0.20 - 0.15 + 0.05 = 0.20
        # Solo B = 0.40 - 0.20 - 0.12 + 0.05 = 0.13
        # Solo C = 0.35 - 0.15 - 0.12 + 0.05 = 0.13
        # Solo AB = 0.20 - 0.05 = 0.15
        # Solo AC = 0.15 - 0.05 = 0.10
        # Solo BC = 0.12 - 0.05 = 0.07
        # Exterior = 1 - 0.83 = 0.17
        data = {
            "input_mode": "probabilities",
            "p_a": 0.50,
            "p_b": 0.40,
            "p_c": 0.35,
            "p_ab": 0.20,
            "p_ac": 0.15,
            "p_bc": 0.12,
            "p_abc": 0.05
        }
        res = solve_three_events(data)
        self.assertAlmostEqual(res["probabilities"]["P(Evento A ∪ Evento B ∪ Evento C)"], 0.83)
        self.assertAlmostEqual(res["regions"]["only_a"]["prob"], 0.20)
        self.assertAlmostEqual(res["regions"]["only_b"]["prob"], 0.13)
        self.assertAlmostEqual(res["regions"]["only_c"]["prob"], 0.13)
        self.assertAlmostEqual(res["regions"]["only_ab"]["prob"], 0.15)
        self.assertAlmostEqual(res["regions"]["only_ac"]["prob"], 0.10)
        self.assertAlmostEqual(res["regions"]["only_bc"]["prob"], 0.07)
        self.assertAlmostEqual(res["regions"]["intersection_abc"]["prob"], 0.05)
        self.assertAlmostEqual(res["regions"]["neither"]["prob"], 0.17)
        # Sum of all 8 regions must be exactly 1.0!
        total_partition = sum(reg["prob"] for reg in res["regions"].values())
        self.assertAlmostEqual(total_partition, 1.0)

    def test_three_events_negative_region(self):
        # P(A)=0.2, but P(AB)=0.2 and P(AC)=0.1 -> Solo A = 0.2 - 0.2 - 0.1 + 0 = -0.1 < 0
        data = {
            "input_mode": "probabilities",
            "p_a": 0.2,
            "p_b": 0.4,
            "p_c": 0.4,
            "p_ab": 0.2,
            "p_ac": 0.1,
            "p_bc": 0.05,
            "p_abc": 0.0
        }
        with self.assertRaises(AxiomViolationError):
            solve_three_events(data)

if __name__ == "__main__":
    unittest.main()
