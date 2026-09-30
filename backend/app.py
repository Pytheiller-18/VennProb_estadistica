"""
app.py - Servidor Flask y API RESTful para la resolución de problemas de probabilidad y diagramas de Venn.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
try:
    from backend.logic import solve_one_event, solve_two_events, solve_three_events, AxiomViolationError
except ImportError:
    from logic import solve_one_event, solve_two_events, solve_three_events, AxiomViolationError

# Configuración de rutas estáticas para poder servir el frontend opcionalmente desde Flask
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

app = Flask(__name__, static_folder=FRONTEND_DIR)
# Habilitar CORS para todas las rutas y orígenes
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/", methods=["GET"])
def serve_index():
    """Sirve la interfaz web si se abre el servidor Flask en el navegador."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>", methods=["GET"])
def serve_static(filename):
    """Sirve archivos estáticos (app.js, style.css, etc.)."""
    return send_from_directory(FRONTEND_DIR, filename)


@app.route("/api/health", methods=["GET"])
def health_check():
    """Endpoint de salud del backend."""
    return jsonify({
        "status": "healthy",
        "service": "Probabilidad & Venn Diagram API",
        "version": "1.0.0"
    }), 200


@app.route("/api/solve", methods=["POST"])
def solve():
    """
    Endpoint principal para resolver problemas de probabilidad y conjuntos.
    Espera un JSON con:
      - num_events: 2 o 3
      - input_mode: 'probabilities' o 'counts'
      - sample_space: float (para counts)
      - parámetros de eventos (p_a, p_b, p_c, p_ab, p_union, etc.)
    """
    if not request.is_json:
        return jsonify({
            "status": "error",
            "error": "La solicitud debe tener formato Content-Type: application/json."
        }), 400

    data = request.get_json()
    if not data:
        return jsonify({
            "status": "error",
            "error": "El cuerpo de la solicitud no puede estar vacío."
        }), 400

    try:
        num_events = int(data.get("num_events", 2))
    except (ValueError, TypeError):
        return jsonify({
            "status": "error",
            "error": "El campo 'num_events' debe ser un número entero (2 o 3)."
        }), 400

    try:
        if num_events == 1:
            result = solve_one_event(data)
        elif num_events == 2:
            result = solve_two_events(data)
        elif num_events == 3:
            result = solve_three_events(data)
        else:
            return jsonify({
                "status": "error",
                "error": "Número de eventos no soportado. Debe ser 2 o 3."
            }), 400

        return jsonify(result), 200

    except AxiomViolationError as e:
        # Validación Axiomática de Kolmogorov: HTTP 400 con mensaje pedagógico
        return jsonify({
            "status": "error",
            "error_type": "AxiomViolationError",
            "error": str(e),
            "code": getattr(e, "code", "AXIOM_VIOLATION")
        }), 400

    except ValueError as e:
        return jsonify({
            "status": "error",
            "error_type": "ValueError",
            "error": str(e)
        }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "error_type": "InternalServerError",
            "error": f"Error inesperado en el servidor: {str(e)}"
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Iniciando servidor Flask en http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
