# Identidad de marca de Luxis

Guía para que todas las pantallas (landing, auth, onboarding y app) se vean como un mismo producto. Si algo no está acá, aplicá el criterio de la sección 1: **sobrio, concreto, de obra**.

## 1. Idea

Luxis le habla a una barraca de materiales, no a una startup. La marca toma lo que esa barraca conoce (el ladrillo, la planilla, el pliego en papel) y le suma precisión: datos reales, fechas, montos y citas a la página.

- **Personalidad:** práctica, confiable y directa. Habla como alguien del rubro que sabe de compras públicas.
- **Lo que evitamos:** el tono de startup ("revolucioná", "potenciado por IA"), la estética tech genérica (violetas, glassmorphism, robots, chispas) y prometer de más.

## 2. Logo

**Marca:** una "L" de cuatro ladrillos en aparejo que se van llenando de color de arriba hacia abajo, como una pared que se levanta. El símbolo cuenta el producto: materiales de construcción y el avance hacia la licitación ganada.

- **Construcción:** grilla de 24 × 24, ladrillos de 6 de alto, juntas de 2 y esquinas de 1.2. Columna de 3 ladrillos de 9 de ancho y base de 11. Opacidades de arriba hacia abajo: 40 %, 70 %, 100 %, y 100 % en la base.
- **Logotipo:** "Luxis" en Geist Semibold (600) con `tracking-tighter`, siempre con mayúscula inicial y nunca en versalitas.
- **Componentes:** `src/components/marca/logo.tsx` exporta:
  - `<Logo />`, que es marca y logotipo y además funciona como link;
  - `<LogoMarca />`, que es solo el símbolo.
  
  Ambos aceptan la `variante`:
  - `'color'` (por defecto): ladrillo sobre papel;
  - `'claro'`: blanco sobre ladrillo o sobre tinta.
- **Favicon:** `src/app/icon.svg`, que es el símbolo sobre papel con esquinas redondeadas.
- **Tamaños:** el símbolo va a 20 px (`size-5`) en barras de navegación, nunca a menos de 14 px, y a 32 px o más en piezas grandes.
- **Aire alrededor:** como mínimo el ancho de un ladrillo chico (9/24 del símbolo) en cada lado.
- **No hacer:**
  - rotarlo;
  - cambiar las opacidades;
  - ponerle sombra o contorno;
  - usar otro color que no sea ladrillo, blanco o tinta;
  - separar el símbolo del logotipo en una misma línea con otro texto;
  - recrearlo con un cuadrado (era el placeholder anterior).

> Pendiente para rafa: `src/components/onboarding/marca.tsx` todavía usa el cuadrado placeholder; reemplazarlo por `<Logo />`, como ya indica su comentario.

## 3. Color

Papel, tinta y un único acento ladrillo. Los tokens ya están en `src/app/globals.css`; usá siempre el token (`bg-primary`, `text-muted-foreground`…) y nunca el hex en el código de la app.

| Rol | Token | Hex | Uso |
|---|---|---|---|
| Papel | `background` | `#F7F6F2` | Fondo general |
| Tarjeta | `card` | `#FFFFFF` | Superficies elevadas |
| Tinta | `foreground` | `#1B1B1B` | Texto y bandas oscuras (sección de datos) |
| Ladrillo | `primary` | `#C4502B` | Acción principal, foco, marca, un dato destacado |
| Arena | `secondary` / `muted` | `#EFEDE7` | Fondos suaves, chips, hover |
| Texto secundario | `muted-foreground` | `#5C5955` | Bajadas, metadatos |
| Borde | `border` | `#E6E3DC` | Divisores, contornos |
| Éxito | `exito` / `exito-suave` | `#2F6B45` / `#E7F0EA` | Cumple, confianza alta |
| Alerta | `alerta` / `alerta-suave` / `alerta-fuerte` | `#B7791F` / `#F6EEDF` / `#7A5410` | Alcanzable, cierres cercanos |
| Error | `error` / `error-suave` | `#A3312B` / `#F5E5E3` | Difícil, fallas |

- **Proporción:** alrededor de 80 % papel y arena, 15 % tinta y 5 % ladrillo. Si el ladrillo aparece en más de dos cosas por pantalla, deja de marcar lo importante.
- **Bandas de color completas:** solo en la landing, con una en tinta (los datos) y otra en ladrillo (el llamado final). En la app no hay bandas.
- **Sin modo oscuro.** Sin degradés de color: lo único permitido es el fundido a transparente de los fondos animados.

## 4. Tipografía

**Geist** para todo y **Geist Mono** para lo que es dato.

| Nivel | Clases | Uso |
|---|---|---|
| Display | `text-5xl` a `text-7xl`, `font-semibold tracking-tighter leading-[1.02]` | Titular del hero, una sola vez |
| Título de sección | `text-4xl md:text-6xl` o `md:text-5xl`, `text-balance` | Encabezado de cada sección |
| Título de bloque | `text-3xl md:text-[2.6rem]` | Pasos, funciones |
| Cuerpo grande | `text-lg text-muted-foreground` | Bajadas |
| Cuerpo | `text-sm` / `text-base` | App |
| Eyebrow | `font-mono text-xs uppercase tracking-wide text-muted-foreground` | Rótulo arriba de cada título ("FUNCIONES") |
| Dato | `font-mono` | Montos, números de compra, URLs, fechas, contadores, citas `[archivo, p. N]` |

- Los títulos van siempre en peso 600; nunca uses 700 u 800.
- Para numerar, usá dos dígitos en mono: `01 / 06`, con el número actual en ladrillo.

## 5. Voz y tono

- **Español rioplatense con voseo:** "encontrá", "subí", "te avisamos".
- **Concreto antes que adjetivos:** "Vendés 5 de los 6 ítems y entregás en Canelones" en lugar de "Gran oportunidad para tu negocio".
- **Números reales o nada.** Si un dato es ilustrativo, que no parezca una métrica del producto.
- **La IA es una herramienta y no el protagonista.** Decimos qué hace ("lee el pliego", "cita la página") y no "IA avanzada". Siempre aclaramos que la decisión es del usuario.
- **Errores y estados vacíos:** qué pasó y qué podés hacer, sin culpas ni signos de exclamación.
- **Palabras prohibidas:** revolucionario, potenciado por IA, mágico, increíble, disruptivo, "en segundos" (si no es cierto).

## 6. Iconografía

- Solo **lucide** (ya instalado), en el grosor por defecto y a `size-4` en texto o `size-5` en bloques.
- El color es el del texto, con ladrillo solo cuando el ícono identifica una función destacada.
- No usar robots, chispas, cerebros, varitas ni emojis como íconos.
- Para viñetas en marketing va un trazo ladrillo de `h-px w-5`, no puntos ni checks genéricos.

## 7. Formas y superficies

- **Radios:**
  - `rounded-md` en componentes de la app (cards de licitación, chips);
  - `rounded-xl` / `rounded-2xl` en paneles de la landing;
  - `rounded-full` en navegación, pastillas y badges de estado.
- **Bordes:** siempre `border` (`#E6E3DC`), de 1 px. La separación se hace con bordes y aire, no con sombras.
- **Sombras:** largas, suaves y con tinte de tinta, como `shadow-[0_40px_80px_-40px_rgba(27,27,27,0.3)]`. Van solo en elementos que flotan (mockups, barra de navegación compacta, tarjetas en 3D) y nunca en cards de la app.
- **Aire:** las secciones de marketing llevan `py-20 md:py-28` o más, y cada idea ocupa su propia pantalla. En la app se usan las densidades de shadcn tal cual.

## 8. Movimiento

El movimiento explica algo (que llegan licitaciones, que se calcula un precio); nunca es decoración pura.

- **Curva de la marca:** `[0.22, 1, 0.36, 1]` (ease-out suave). En listas que entran se usan springs (`damping 26, stiffness 260`).
- **Duraciones:** 0.45 a 0.7 s para entradas y menos de 0.3 s para hover.
- **Entrada estándar:** opacidad 0 → 1, `y` 24 → 0 y `blur(6px)` → 0, una sola vez al entrar en pantalla (componente `Aparecer`).
- **Siempre `MotionConfig reducedMotion="user"`:** con movimiento reducido, todo se muestra en su estado final.
- **Fondos animados (reactbits):** solo en la landing y solo en la paleta.
  - `Threads`: hilos ladrillo, tinta o blanco.
  - `DotGrid`: puntos en borde, ladrillo al pasar el mouse.
  - `Noise`: grano de papel con opacidad de 0.035 o menos.
  
  Sin partículas, auroras ni degradés.
- **Texto animado (reactbits):** `BlurText` para el titular, `RotatingText` con resaltado ladrillo para el rubro, `ShinyText` en el CTA principal y `CountUp` para cifras reales.
- **En la app:** solo transiciones de estado y `CountUp` en el encabezado del dashboard. Nada de fondos animados.

## 9. Patrones reutilizables

- **Encabezado de sección:** eyebrow mono, título 600 balanceado y bajada opcional en `muted-foreground`.
- **Estados documentales:**
  - Cumple: `bg-exito-suave text-exito`;
  - Alcanzable: `bg-alerta-suave text-alerta-fuerte`;
  - Difícil: `bg-error-suave text-error`.
- **Confianza:** usar `nivelConfianza()` de `src/components/licitaciones/badge-confianza.tsx` (alta ≥ 75, media ≥ 50).
- **Ventana de producto en marketing:** marco con tres puntos grises y una URL en mono, sobre `bg-background` con borde y sombra larga.
- **CTA:**
  - el principal es `Button` default (ladrillo), con "Crear cuenta" y flecha;
  - el secundario es `outline`, con "Ingresar" o "Ya tengo cuenta";
  - sobre ladrillo, el principal pasa a ser papel con texto tinta.
