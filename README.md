# VennProb - Solucionador Interactivo de Probabilidad y Diagramas de Venn

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0%2B-green?logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-yellow?logo=javascript)
![D3.js](https://img.shields.io/badge/Visualization-D3.js%20%2B%20Venn.js-orange)
![KaTeX](https://img.shields.io/badge/Math-KaTeX%20LaTeX-brightgreen)
![License](https://img.shields.io/badge/License-MIT-purple)

Aplicacin web interactiva de alto rendimiento orientada a la **Estadstica Inferencial** y la **Teora de Conjuntos**. Automatiza la resolucin matemtica rigurosa de problemas de probabilidad de **2 y 3 eventos**, genera la deduccin paso a paso sustentada en los **Axiomas de Kolmogorov** y el **Principio de Inclusin-Exclusin**, y proyecta diagramas de Venn proporcionales e interactivos.

---

## Caractersticas Principales

- **Motor Matemtico Riguroso (ackend/logic.py):**
  - **Probabilidad Clsica:** Clculo simple P(A) = |A| / |S| mediante la regla de Laplace.
  - **Lgica de 2 Eventos:** Clasificacin de eventos disjuntos vs. intersecantes y aplicacin de la regla general de adicin: P(A u B) = P(A) + P(B) - P(A n B).
  - **Lgica de 3 Eventos:** Deduccin exacta de la interseccin triple o unin total: P(A n B n C) = P(A u B u C) + P(A n B) + P(A n C) + P(B n C) - P(A) - P(B) - P(C).
  - **Particin Completa del Espacio Muestral:** Descomposicin en regiones mutuamente excluyentes (hasta 8 subregiones disjuntas) cuya suma satisface estrictamente 1.0.
  - **Probabilidades Condicionales y Complementarias:** Clculo de P(A|B), P(B|A), P(A^c), P(B^c).
  - **Validacin Axiomtica de Kolmogorov (HTTP 400):** Deteccin y rechazo inmediato de datos inconsistentes (probabilidades menores a 0 o mayores a 1, sumas disjuntas mayores a 1, intersecciones mayores que eventos individuales o regiones negativas).

- **Frontend Dinmico e Intuitivo (rontend/):**
  - Diseo moderno con esttica *Glassmorphism* y modo oscuro.
  - Alternancia entre modo de **Probabilidades directas [0, 1]** o **Conteos / Frecuencias (|E|, |S|)**.
  - **Presets de Estudio:** Casos predeterminados para pruebas rpidas (Estudiantes, Dados Disjuntos, Plataformas de Streaming, etc.).
  - **Visualizacin Proporcional (D3.js + Venn.js):** Crculos dinmicos con tooltips interactivos con detalle de proporciones y conteos estimados.
  - **Exportacin SVG:** Descarga directa del diagrama de Venn en formato vectorial.
  - **Renderizado Matemtico KaTeX:** Frmulas tericas y sustituciones numricas en LaTeX.

---

## Estructura del Proyecto

`	ext
VennProb_estadistica/
??? backend/
?   ??? app.py           # Servidor RESTful Flask y endpoints
?   ??? logic.py         # Motor matemtico y validaciones axiomticas
?   ??? test_logic.py    # Suite de pruebas unitarias para logic.py
?   ??? test_api.py      # Pruebas de integracin de la API REST
??? frontend/
?   ??? index.html       # Estructura semntica de la UI
?   ??? app.js           # Lgica cliente, consumo de API y Venn.js
?   ??? style.css        # Sistema de diseo, Glassmorphism y temas
??? .gitignore           # Exclusiones de Git
??? requirements.txt     # Dependencias de Python
??? README.md            # Documentacin del proyecto
`

---

## Requisitos Previos

- **Python 3.10 o superior**
- **Navegador web moderno** (Chrome, Firefox, Edge, Safari)

---

## Instalacin y Puesta en Marcha

1. **Clonar el repositorio:**
   `ash
   git clone https://github.com/Pytheiller-18/VennProb_estadistica.git
   cd VennProb_estadistica
   `

2. **Instalar dependencias:**
   `ash
   pip install -r requirements.txt
   `

3. **Iniciar el servidor backend:**
   `ash
   python backend/app.py
   `
   *El servidor quedar disponible en:* http://127.0.0.1:5000/

4. **Abrir la aplicacin:**
   Abre tu navegador e ingresa a:
   ? **http://127.0.0.1:5000/**

---

## Ejecucin de Pruebas Automatizadas

El proyecto cuenta con suites de tests que validan tanto el comportamiento matemtico como la respuesta de la API:

`ash
# Validar el motor matemtico (9 tests)
python backend/test_logic.py

# Validar la API Flask y los cdigos HTTP 200/400 (6 tests)
python backend/test_api.py
`

---

## API Endpoints

### POST /api/solve
Resuelve el problema de probabilidad y devuelve la particin de Venn y los pasos algebraicos.

- **Content-Type:** pplication/json
- **Ejemplo Payload (2 Eventos):**
  `json
  {
    "num_events": 2,
    "input_mode": "probabilities",
    "p_a": 0.6,
    "p_b": 0.5,
    "p_ab": 0.3
  }
  `
- **Respuesta (200 OK):**
  JSON con 	ypology, steps, probabilities, egions y enn_data.

### GET /api/health
Verifica la disponibilidad del servicio.

---

## Licencia

Distribuido bajo la Licencia MIT.
