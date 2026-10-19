# 🌵💀 El Vengador del Desierto: La Furia de los 3 Ojos 🔥👁️

Un frenético juego arcade de disparos retro ambientado en un desierto nocturno maldito. Encarnas al **Pistolero Esqueleto Espectral**, armado con sus revólveres gemelos de plasma esmeralda, combatiendo oleadas de monstruos mutantes hasta invocar y derrotar al legendario **Monstruo de 3 Ojos** a los 5,000 puntos.

---

## 🗺️ Avance Continuo del Mapa (Side-Scroller)

- A medida que caminas con **Flecha Derecha**, el personaje avanza a través del desierto nocturno infinito.
- La cámara sigue tu camino con efectos de paralaje multidimensionales: estrellas, luna, dunas lejanas y ruinas antiguas (columnas, árboles secos, tótems de calaveras y monolitos).
- El HUD incluye un contador de **DISTANCIA** en metros para seguir tu avance.

---

## 🎮 Controles del Juego

| Tecla / Acción | Función |
| :--- | :--- |
| **Flecha Arriba** / **W** | **Saltar** (Incluye **Doble Salto** en el aire) |
| **Flecha Izquierda** / **A** | **Retroceder** / Moverse a la izquierda |
| **Flecha Derecha** / **D** | **Avanzar** / Moverse a la derecha |
| **Flecha Abajo** / **S** | **Bajar / Agacharse** (Reduce tu hitbox para esquivar proyectiles aéreos; caída rápida si estás en el aire) |
| **Espacio** / **Click Izquierdo** | **Disparar** revólveres gemelos con munición espectral verde |
| **C** / **Click Derecho** | **Super Furia Espectral** (Descarga 360° al cargar la barra al 100%) |
| **P** / **Escape** | Pausar el juego |
| **Botones Táctiles** | Controles en pantalla integrados para móviles y tablets |

---

## 👾 Monstruos y Tipos de Ataques

1. **🌵 Cactus Maldito:**
   - Emerge de las dunas del desierto.
   - Lanza ráfagas de 3 espinas afiladas en abanico.
2. **🦂 Escorpión Gigante:**
   - Depredador terrestre acorazado con tenazas.
   - Dispara proyectiles parabólicos de veneno ácido concentrado que impactan en la arena.
3. **🐺 Lobo Espectral:**
   - Rápida bestia fantasmal que embiste a gran velocidad dejando estelas de humo azul.
4. **🦇 Monstruos Voladores (Ojos Alados / Gárgolas):**
   - Surcan el cielo nocturno en trayectorias sinusoidales.
   - Lanzan orbes de plasma violeta teledirigidos hacia el jugador.
5. **👁️ El Destructor del Desierto — Jefe de 3 Ojos (Aparece a los 5000 puntos):**
   - Colosal titán beige con cuernos, fauces de colmillos y 6 brazos con garras.
   - **3 Ojos Carmesí:** Cargan y disparan rayos láser triples continuos.
   - **Golpes de Garras:** Provocan terremotos de arena con ondas de choque que barren el suelo.
   - **Invocación:** Invoca enjambres de monstruos voladores.
   - **Modo Berserk (<35% HP):** Ráfaga implacable de rayos y fuego maldito.

---

## ⚡ Power-ups y Objetos en el Desierto

- 💚 **Alma Espectral:** Restaura +30 puntos de vida.
- ⚡ **Munición Rápida:** Disparo triple continuo de alta cadencia durante 8 segundos.
- 🔥 **Orbe de Furia:** Llena instantáneamente el medidor de Furia Espectral al 100%.

---

## 🚀 Cómo Iniciar el Juego Localmente

Tienes dos formas de ejecutar el juego:

### Opción A: Entorno Virtual de Python (.venv) con Servidor y Base de Datos SQLite
El entorno virtual ya está creado y configurado en `.venv`:

1. **Doble clic en el archivo:**
   - [iniciar_juego.bat](file:///c:/juego/iniciar_juego.bat)

2. **O desde la terminal:**
   ```powershell
   # Activar el entorno virtual
   .\.venv\Scripts\Activate.ps1
   # o en CMD: .\.venv\Scripts\activate.bat

   # Iniciar el servidor con API de puntuaciones
   python server.py
   ```
   Abre en tu navegador:
   👉 **http://localhost:5000/**

---

### Opción B: Con Node / Vite
Si prefieres el servidor Vite de desarrollo:
```powershell
npm run dev
```
Abre en tu navegador:
👉 **http://localhost:5173/**

