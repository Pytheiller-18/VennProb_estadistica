# VennProb v2.1 — Solucionador de Probabilidad, Diagramas de Venn y Calculadora Científica

![Version](https://img.shields.io/badge/Version-2.1.0-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0%2B-green?logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-yellow?logo=javascript)
![D3.js](https://img.shields.io/badge/Visualizaci%C3%B3n-D3.js%20%2B%20Venn.js-orange)
![KaTeX](https://img.shields.io/badge/Matem%C3%A1ticas-KaTeX%20LaTeX-brightgreen)
![Casio](https://img.shields.io/badge/Calculadora-Casio%20fx--350ES%20Plus-darkblue)
![Licencia](https://img.shields.io/badge/Licencia-MIT-purple)

**VennProb** es una plataforma web integral, interactiva y de alto rendimiento orientada a la **Estadística Inferencial**, la **Probabilidad** y la **Teoría de Conjuntos**. Permite resolver problemas probabilísticos de **1, 2 y 3 eventos**, graficar diagramas de Venn proporcionales con **datos y porcentajes representados directamente dentro de las regiones de la gráfica**, generar deducciones paso a paso sustentadas en los **Axiomas de Kolmogorov** y el **Principio de Inclusión-Exclusión de Poincaré**, y utilizar una **Calculadora Científica inspirada en la Casio fx-350ES PLUS** con cursor de texto en pantalla LCD y soporte nativo para fracciones (`■/□`, `S↔D`).

---

## 🚀 Novedades de la Versión 2.1

### 📊 Representación de Datos Dentro del Diagrama de Venn
- **Valores en cada región:** Tanto en el Solucionador como en el Graficador Directo, cada región y lente de intersección proyecta en la misma gráfica:
  - Nombre del conjunto o intersección ($A$, $B$, $C$, $A \cap B$, $A \cap C$, $B \cap C$, $A \cap B \cap C$).
  - Valor numérico exacto de probabilidad ($P$) o conteo ($n$).
  - Porcentaje correspondiente respecto al espacio muestral total ($S$ / $\mathbb{U}$).
- **Marco del Espacio Muestral ($\mathbb{U}$):** Identificador visual de Universo en la esquina superior izquierda y tarjeta en la esquina superior derecha indicando el **Exterior / Ninguno** (el complemento $(A \cup B)^c$ o $(A \cup B \cup C)^c$).
- **Diagrama de Venn para 1 Evento:** Representación visual con el rectángulo del Universo $\mathbb{U}$, el círculo del Evento $A$ con su probabilidad y conteo, y el área complementaria con $P(A^c)$ y los odds asociados.

### 🔢 Calculadora Científica Casio fx-350ES PLUS
- **Cursor de Texto LCD Activo:** Pantalla con cursor parpadeante que indica con exactitud la posición de edición. Permite desplazarse a izquierda y derecha con los botones de flechas (◄ y ►) o teclas físicas, facilitando inserciones y correcciones con la tecla `DEL`.
- **Tecla de Fracción Natural (`■/□`):** Permite escribir fracciones directamente en pantalla y números mixtos ($a \frac{b}{c}$) mediante `SHIFT`.
- **Conversor Estándar/Decimal (`S↔D`):** Algoritmo de fracciones continuas para alternar instantáneamente entre la fracción irreducible ($\frac{a}{b}$), el número mixto ($a \frac{b}{c}$) y la notación decimal.
- **Funciones Científicas Completas:** Trigonometría (DEG, RAD, GRAD), funciones hiperbólicas, combinatoria ($nCr$), permutaciones ($nPr$), factoriales ($x!$), potencias ($x^y$), raíces ($\sqrt{}$, $\sqrt[3]{}$, $\sqrt[x]{}$), logaritmos ($\log$, $\ln$), memoria (STO / RCL) e historial de cálculos.

---

## 🌟 Módulos de la Aplicación

La interfaz está dividida en cuatro pestañas de navegación dedicadas:

1. **🧮 Solucionador de Probabilidad:**
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
   - Sección independiente que mantiene limpia la vista principal.
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
│   ├── app.py           # Servidor RESTful Flask y rutas API
│   ├── logic.py         # Motor matemático, validaciones axiomáticas y particiones
│   ├── test_logic.py    # Suite de pruebas unitarias para logic.py
│   └── test_api.py      # Pruebas de integración de endpoints REST
├── frontend/
│   ├── index.html       # Estructura semántica, pestañas y teclado Casio
│   ├── app.js           # Lógica cliente, renderizado Venn con etiquetas y motor calculadora
│   └── style.css        # Sistema de diseño Glassmorphism, temas y display LCD
├── .gitignore           # Exclusiones de control de versiones
├── requirements.txt     # Dependencias de Python
└── README.md            # Documentación general del proyecto
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

El proyecto incluye 15 pruebas unitarias y de integración que verifican la consistencia matemática y las respuestas HTTP:

```bash
# Ejecutar todas las pruebas del backend
python -m unittest discover backend
```

---

## 📡 Endpoints de la API REST

### `POST /api/solve`
Calcula la solución del problema de probabilidad según el número de eventos indicado.

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

### `GET /api/health`
Retorna el estado de disponibilidad del backend.

---

## 📄 Licencia

Distribuido bajo la Licencia **MIT**. Consulta el código fuente para más detalles.
