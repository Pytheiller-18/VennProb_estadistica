import sys
import unittest
import json
sys.path.insert(0, ".")
from backend.app import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_solve_2_events_success(self):
        payload = {
            "num_events": 2,
            "input_mode": "probabilities",
            "p_a": 0.5,
            "p_b": 0.4,
            "p_ab": 0.2
        }
        res = self.client.post("/api/solve", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("venn_data", data)
        self.assertEqual(len(data["venn_data"]), 3)
        self.assertIn("steps", data)
        self.assertIn("typology", data)

    def test_solve_3_events_success(self):
        payload = {
            "num_events": 3,
            "input_mode": "probabilities",
            "p_a": 0.5,
            "p_b": 0.4,
            "p_c": 0.35,
            "p_ab": 0.2,
            "p_ac": 0.15,
            "p_bc": 0.12,
            "p_abc": 0.05
        }
        res = self.client.post("/api/solve", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(len(data["venn_data"]), 7)

    def test_solve_axiom_error_negative_prob(self):
        payload = {
            "num_events": 2,
            "input_mode": "probabilities",
            "p_a": -0.2,
            "p_b": 0.5,
            "p_ab": 0.1
        }
        res = self.client.post("/api/solve", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["code"], "PROB_OUT_OF_BOUNDS")

    def test_solve_axiom_error_intersection_exceeds(self):
        payload = {
            "num_events": 2,
            "input_mode": "probabilities",
            "p_a": 0.3,
            "p_b": 0.4,
            "p_ab": 0.6
        }
        res = self.client.post("/api/solve", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["code"], "INTERSECTION_EXCEEDS_EVENT")

    def test_calculate_api(self):
        payload = {"expr": "nCr(5, 2) + 10", "angle_mode": "DEG"}
        res = self.client.post("/api/calculate", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["result"], 20.0)

    def test_calculate_fraction(self):
        payload = {"expr": "3 / 4", "angle_mode": "DEG"}
        res = self.client.post("/api/calculate", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["fraction"]["numerator"], 3)
        self.assertEqual(data["fraction"]["denominator"], 4)


if __name__ == "__main__":
    unittest.main()

