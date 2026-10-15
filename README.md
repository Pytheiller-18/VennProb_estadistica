# VennProb v2.2 — Solucionador de Probabilidad, Diagramas de Venn y Calculadora Científica

![Version](https://img.shields.io/badge/Version-2.2.0-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0%2B-green?logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-Modular%20ES6%2B-yellow?logo=javascript)
![D3.js](https://img.shields.io/badge/Visualizaci%C3%B3n-D3.js%20%2B%20Venn.js-orange)
![KaTeX](https://img.shields.io/badge/Matem%C3%A1ticas-KaTeX%20LaTeX-brightgreen)
![Casio](https://img.shields.io/badge/Calculadora-Casio%20fx--350ES%20Plus-darkblue)
![Licencia](https://img.shields.io/badge/Licencia-MIT-purple)

**VennProb** es una plataforma web integral, interactiva y de alto rendimiento orientada a la **Estadística Inferencial**, la **Probabilidad** y la **Teoría de Conjuntos**. Permite resolver problemas probabilísticos de **1, 2 y 3 eventos**, graficar diagramas de Venn proporcionales con **datos y porcentajes representados directamente dentro de las regiones de la gráfica**, generar deducciones paso a paso sustentadas en los **Axiomas de Kolmogorov** y el **Principio de Inclusión-Exclusión de Poincaré**, y utilizar una **Calculadora Científica inspirada en la Casio fx-350ES PLUS** con cursor de texto en pantalla LCD y soporte nativo para fracciones (`■/□`, `S↔D`).

---

## 🚀 Novedades de la Versión 2.2 — Arquitectura Modular por Carpetas

Se organizó la base de código tanto en el cliente como en el servidor en **módulos desacoplados y carpetas especializadas**:

- 📂 **Módulo de Espacio Muestral (`espacio_muestral`)**:
  - **Backend:** Validación de axiomas de Kolmogorov (`axioms.py`), cálculo de Laplace, normalización de cardinalidades de $S$ o $\mathbb{U}$, y motor de resolución de 1, 2 y 3 eventos (`solver.py`).
  - **Frontend:** Formularios interactivos, gestión de eventos disjuntos, visualización del espacio muestral para 1 evento, tarjeta de exterior/complemento y tabla de métricas inferenciales.
- 📂 **Módulo de Calculadora Científica (`calculadora`)**:
  - **Backend:** Evaluación matemática segura (`scientific.py`), combinatoria ($nCr$, $nPr$, $n!$), y algoritmo de fracciones continuas para simplificación irreducible.
  - **Frontend:** Emulación Casio fx-350ES PLUS, cursor LCD parpadeante y navegable con flechas, teclas serigrafiadas con doble función (SHIFT/ALPHA), fracciones naturales (`■/□`) y conversor `S↔D`.
- 📂 **Módulo de Diagramas de Venn (`diagrama_venn`)**:
  - **Backend:** Cálculo de particiones disjuntas y regiones mutuamente excluyentes para 2 y 3 conjuntos (`partitions.py`).
  - **Frontend:** Renderizador D3.js y Venn.js con textos de probabilidad/conteo impresos dentro de cada área o intersección, enmarcado del universo ($\mathbb{U}$), panel de graficación por datos directos y exportación SVG.
- 📂 **Módulo de Ejemplos (`ejemplos`)**:
  - Catálogo de problemas clásicos organizados por dificultad con precarga automática en el solucionador en un clic.
- 📂 **Módulo Común (`common`)**:
  - Estado global reactivo (`state.js`), cliente de API REST y healthcheck (`api.js`), y controlador de pestañas (`navigation.js`).

---

## 🌟 Módulos de la Aplicación

La interfaz está dividida en cuatro pestañas de navegación dedicadas:

1. **🧮 Solucionador de Probabilidad (Espacio Muestral):**
   - Soporte para **1, 2 y 3 eventos**.
   - Modo de entrada por **Probabilidades directas $[0, 1]$** o **Conteos / Frecuencias ($|E|, |S|$)**.
   - Detección automática de tipología (mutuamente excluyentes/disjuntos, intersección dependiente, deducción algebraica).
   - Generación paso a paso de fórmulas en KaTeX (LaTeX interactivo).
   - Tabla exhaustiva de métricas inferenciales (probabilidades simples, compuestas, condicionales $P(A|B)$, complementos y odds).
   - Diagrama de Venn proporcional con datos impresos dentro de las áreas.

2. **📊 Diagrama de Venn (Datos Directos):**
   - Diseñado para graficar diagramas de 2 o 3 conjuntos ingresando de forma directa el tamaño o cantidad de cada partición disjunta (Solo A, Solo B, Intersecciones y Exterior).
   - Muestra cada valor directamente dentro del círculo o región de cruce.
   - Exportación vectorial a formato **SVG**.

3. **📚 Ejemplos y Ejercicios Prácticos:**
   - Banco de ejercicios clásicos: dados disjuntos, asignaturas intersecantes, encuestas con conteos ($N=200$), plataformas de streaming (3 eventos con intersección triple) e idiomas con deducción de Poincaré.
   - Botón *"Cargar en Solucionador"* para rellenar los formularios y resolver el problema en un clic.

4. **🔬 Calculadora Científica Casio fx-350ES PLUS:**
   - Emulación del teclado y pantalla LCD verde oliva de la clásica Casio fx-350ES PLUS.
   - Cursor de navegación editable.
   - Soporte para fracciones y simplificación automática.
   - Historial de operaciones reutilizable con un clic.

---

## 📁 Estructura del Código

```text
VennProb_estadistica/
├── backend/
│   ├── app.py                      # Servidor Flask y endpoints REST (/api/solve, /api/calculate, /api/health)
│   ├── logic.py                    # Fachada unificada y compatibilidad hacia atrás
│   ├── modules/                    # Módulos del Backend
│   │   ├── espacio_muestral/       # Módulo del Espacio Muestral y Axiomas
│   │   │   ├── __init__.py
│   │   │   ├── axioms.py           # Validaciones axiomáticas de Kolmogorov
│   │   │   └── solver.py           # Solucionador para 1, 2 y 3 eventos
│   │   ├── calculadora/            # Módulo de la Calculadora Científica
│   │   │   ├── __init__.py
│   │   │   └── scientific.py       # Combinatoria (nCr, nPr, n!), fracciones continuas y safe_eval
│   │   └── diagrama_venn/          # Módulo de Particiones de Venn
│   │       ├── __init__.py
│   │       └── partitions.py       # Cálculo de particiones disjuntas 2 y 3 conjuntos
│   ├── test_logic.py               # Pruebas unitarias para logic.py
│   ├── test_api.py                 # Pruebas de integración de endpoints REST
│   └── test_modules.py             # Pruebas unitarias directas sobre los submódulos
├── frontend/
│   ├── index.html                  # Interfaz semántica con inclusión modular de estilos y scripts
│   ├── app.js                      # Orquestador principal de inicialización
│   ├── style.css                   # Sistema de diseño base Glassmorphism y temas
│   └── modules/                    # Módulos del Frontend
│       ├── common/                 # Componentes compartidos
│       │   ├── state.js            # Estado reactivo global
│       │   ├── api.js              # Conexión HTTP y healthcheck
│       │   └── navigation.js       # Navegación entre pestañas
│       ├── espacio_muestral/       # Módulo del Espacio Muestral
│       │   ├── espacio_muestral.js # Lógica del solucionador, métricas y pasos KaTeX
│       │   └── espacio_muestral.css# Estilos de formulario, inputs y tablas
│       ├── calculadora/            # Módulo de la Calculadora Casio
│       │   ├── calculadora.js      # Motor LCD, cursor, fracciones naturales y eventos
│       │   └── calculadora.css     # Chasis Casio, display LCD y botonera serigrafiada
│       ├── diagrama_venn/          # Módulo de Diagramas de Venn
│       │   ├── diagrama_venn.js    # Gráficas D3.js/Venn.js con datos impresos y exportación SVG
│       │   └── diagrama_venn.css   # Contenedores de diagrama, tooltips y badges de universo
│       └── ejemplos/               # Módulo de Ejemplos
│           ├── ejemplos.js         # Banco de problemas y precarga en el solucionador
│           └── ejemplos.css        # Tarjetas de ejercicios y badges
├── .gitignore                      # Exclusiones de Git
├── requirements.txt                # Dependencias de Python
└── README.md                       # Documentación exhaustiva del proyecto
```

---

## 🛠️ Instalación y Ejecución Local

### Requisitos Previos
- **Python 3.10 o superior**
- **Navegador web moderno** (Chrome, Firefox, Edge, Safari, Brave)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Pytheiller-18/VennProb_estadistica.git
   cd VennProb_estadistica
   ```

2. **Instalar dependencias de Python:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Iniciar el servidor Flask:**
   ```bash
   python backend/app.py
   ```
   *El servidor quedará activo en:* `http://127.0.0.1:5000/`

4. **Acceder a la aplicación:**
   Abre tu navegador e ingresa a:
   👉 **http://127.0.0.1:5000/**

---

## 🧪 Pruebas Automatizadas

El proyecto incluye **20 pruebas automatizadas** que verifican exhaustivamente la consistencia matemática, los axiomas de Kolmogorov, las particiones de Venn, las funciones de la calculadora científica y las respuestas HTTP de los endpoints REST:

```bash
# Ejecutar toda la suite de pruebas automatizadas
python -m unittest discover backend
```

---

## 📡 Endpoints de la API REST

### `POST /api/solve`
Calcula la solución del problema de probabilidad según el número de eventos indicado (1, 2 o 3 eventos).

- **Headers:** `Content-Type: application/json`
- **Ejemplo Payload (2 Eventos):**
  ```json
  {
    "num_events": 2,
    "input_mode": "probabilities",
    "names": { "A": "Matemáticas", "B": "Inglés" },
    "p_a": 0.60,
    "p_b": 0.50,
    "p_ab": 0.30
  }
  ```
- **Respuesta (HTTP 200):**
  Contiene `typology`, `steps`, `probabilities`, `regions`, `venn_data` y `names`.

### `POST /api/calculate`
Evalúa de forma segura expresiones matemáticas y combinatorias para la calculadora científica con soporte para grados (DEG), radianes (RAD) y gradianes (GRAD).

- **Headers:** `Content-Type: application/json`
- **Ejemplo Payload:**
  ```json
  {
    "expr": "nCr(5, 2) + sin(30)",
    "angle_mode": "DEG"
  }
  ```
- **Respuesta (HTTP 200):**
  ```json
  {
    "status": "success",
    "result": 10.5,
    "fraction": { "numerator": 21, "denominator": 2, "exact": true, "str": "21/2" }
  }
  ```

### `GET /api/health`
Retorna el estado de disponibilidad del backend.

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el código fuente para más detalles.
