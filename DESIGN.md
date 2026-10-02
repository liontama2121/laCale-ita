---
name: La Caleñita
description: Empanadas vallunas recién fritas, anunciadas desde una freidora de noche.
colors:
  noche: "#120C07"
  noche-2: "#1C130B"
  noche-3: "#2A1C10"
  borde-suave: "rgba(255, 201, 61, 0.16)"
  crema: "#F8EBD2"
  crema-suave: "#CDBBA0"
  dorado: "#FFC93D"
  maiz: "#F5A623"
  aji: "#F0533A"
  verde: "#25D366"
  tinta-verde: "#08240F"
  masa-cruda: "#F4E1A6"
  masa-dorada: "#EE9A22"
  grumo: "#B9560C"
  repulgue: "#E8B04E"
  aceite-fondo: "#6E3A08"
  aceite-medio: "#E08A14"
  metal-alto: "#4A3B30"
  metal-bajo: "#16100B"
  combo-brasa: "#3A230C"
typography:
  display:
    fontFamily: "Shrikhand, Bricolage Grotesque, serif"
    fontSize: "clamp(2.3rem, 9.6vw, 5.2rem)"
    fontWeight: 400
    lineHeight: 1.08
  headline:
    fontFamily: "Shrikhand, Bricolage Grotesque, serif"
    fontSize: "clamp(2.1rem, 5.6vw, 3.8rem)"
    fontWeight: 400
    lineHeight: 1.1
  price:
    fontFamily: "Shrikhand, Bricolage Grotesque, serif"
    fontSize: "clamp(2.6rem, 7vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Shrikhand, Bricolage Grotesque, serif"
    fontSize: "clamp(1.35rem, 4.6vw, 1.8rem)"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.2
rounded:
  enfoque: "6px"
  superficie: "24px"
  foto: "28px"
  pill: "999px"
spacing:
  gutter: "16px"
  gutter-ancho: "32px"
  fila: "12px"
  bloque: "16px"
  seccion: "88px"
  seccion-ancha: "104px"
  marco-max: "1200px"
components:
  button-pedir:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.tinta-verde}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  button-pedir-grande:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.tinta-verde}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    height: "58px"
  button-sabor-mas:
    backgroundColor: "{colors.dorado}"
    textColor: "{colors.noche}"
    rounded: "{rounded.pill}"
    size: "48px"
  button-sabor-menos:
    backgroundColor: "{colors.noche-3}"
    textColor: "{colors.crema}"
    rounded: "{rounded.pill}"
    size: "48px"
  button-combo-pedir:
    backgroundColor: "transparent"
    textColor: "{colors.dorado}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: "48px"
  chip-precio:
    backgroundColor: "{colors.dorado}"
    textColor: "{colors.noche}"
    rounded: "{rounded.pill}"
    padding: "6px 18px 8px"
  card-sabor:
    backgroundColor: "{colors.noche-2}"
    textColor: "{colors.crema}"
    rounded: "{rounded.superficie}"
    padding: "14px 16px 14px 12px"
  card-sabor-escogido:
    backgroundColor: "{colors.noche-3}"
    textColor: "{colors.crema}"
    rounded: "{rounded.superficie}"
  card-combo:
    backgroundColor: "{colors.noche-2}"
    textColor: "{colors.crema}"
    rounded: "{rounded.superficie}"
    padding: "28px 24px 30px"
  canasta:
    backgroundColor: "{colors.noche-3}"
    textColor: "{colors.crema}"
    rounded: "{rounded.superficie}"
    padding: "14px 16px"
  foto-plato:
    rounded: "{rounded.foto}"
  nav:
    backgroundColor: "{colors.noche}"
    textColor: "{colors.crema}"
    height: "64px"
---

# Design System: La Caleñita

> Alcance: este documento gobierna solo la landing pública (`index.html`, `css/landing.css`, `js/landing.js`). Todos sus tokens viven bajo `.landing` en `css/landing.css`. El panel, el login y `css/shared.css` quedan fuera de este sistema y no se documentan aquí; `shared.css` se sigue cargando en la landing, pero sus fuentes y colores no la gobiernan.

## Overview

**Creative North Star: "La freidora de noche"**

La landing es la cocina de Lina a oscuras, a la hora del antojo: un fondo marrón casi negro, una sola fuente de luz que es el aceite dorado de la paila, y empanadas que se fríen en vivo. Todo el calor visual sale del aceite: resplandores ámbar, burbujas que suben, vapor que se escapa por encima. La empanada ilustrada es el personaje del sistema y aparece en todas partes, siempre la misma silueta en SVG, pasando de cruda (pálida) a dorada según el momento.

La densidad es generosa y vertical, pensada para el celular: una cosa por pantalla, títulos gordos y redondos en Shrikhand, texto de apoyo corto en Bricolage Grotesque. El tono es de vecina caleña, festivo pero sin ruido. La única foto real (el plato de Lina) entra como prueba de que lo dibujado existe, con su propio vapor encima.

El sistema reemplaza por completo el mundo anterior de cartel tipográfico de La Linterna, que se rechazó porque no abría el apetito. No quedan tintas fluorescentes, esquinas rectas ni letras de madera.

**Key Characteristics:**
- Fondo nocturno cálido en tres escalones (`noche`, `noche-2`, `noche-3`), nunca negro puro ni gris frío.
- La luz es dorada y viene del aceite; los bordes son hilos dorados translúcidos.
- La empanada SVG es el motivo único: se dora con la propiedad registrada `--d` (0 cruda, 1 dorada).
- Verde WhatsApp solo en lo que abre el chat.
- Todo lo que se toca es pill; las superficies a 24px; la foto a 28px.
- Movimiento de cocina (freír, burbujear, humear, saltar a la canasta), siempre apagado con `prefers-reduced-motion`.

## Colors

Paleta de cocina de noche: marrones tostados de fondo, crema de masa para el texto, dorado de aceite como acento, y un verde ajeno al mundo que existe solo para pedir.

### Primary
- **Dorado de Aceite** (`dorado`): el acento del mundo. Palabra destacada del titular ("recién fritas"), chip de precio, botón "+" de cada sabor, precios de combo, marca en la nav y el pie, anillo de foco, ícono de canasta, selección de texto.
- **Maíz Tostado** (`maiz`): dorado más profundo para resplandores y la barra de scroll. Va en gradientes y halos, no en texto.

### Secondary
- **Verde Pedido** (`verde`) con **Tinta de Hoja** (`tinta-verde`) encima: botón "Pedir por WhatsApp" (nav, hero, canasta), botón flotante y el ícono del teléfono en el pie. La sombra de estos botones es un halo verde.

### Tertiary
- **Ají** (`aji`): solo el contador redondo de la canasta, con texto blanco. Es la chispa que dice "tienes algo ahí".

### Neutral
- **Noche** (`noche`): fondo de página, hero y nav (al 86 % con desenfoque). También el texto sobre dorado.
- **Noche Brasa** (`noche-2`): superficies de segundo plano: sección de la foto, filas de sabor, tarjetas de combo, pie.
- **Noche Carbón** (`noche-3`): superficie elevada o escogida: fila de sabor con cantidad, botón "menos", canasta, números de los pasos.
- **Hilo Dorado** (`borde-suave`): borde de 1px de toda superficie y divisor de nav y pie.
- **Crema de Masa** (`crema`): texto principal y titulares.
- **Crema Tostada** (`crema-suave`): texto de apoyo, subtítulos, detalles de combo, pasos.

### Colores de la ilustración
Viven solo dentro de la empanada SVG y la paila, nunca en la interfaz: `masa-cruda` y `masa-dorada` (las dos capas de la masa, la dorada con opacidad `--d`), `grumo` (puntitos de fritura), `repulgue` (el borde de bolitas), el gradiente radial del aceite (`dorado` al centro, `aceite-medio`, `aceite-fondo` al borde) y el metal de la paila (`metal-alto` a `metal-bajo`). `combo-brasa` arranca el degradé de 160 grados de la tarjeta del combo x6.

### Named Rules
**The Verde Solo Pide Rule.** El verde existe únicamente en lo que abre WhatsApp. Ningún otro elemento, decoración ni estado usa verde.

**The Luz de Paila Rule.** Toda luz del sistema es cálida y sale del aceite: halos radiales ámbar, sombras teñidas de dorado o de verde en el caso del botón de pedir. No hay luces frías ni blancos puros fuera del vapor y del texto del contador.

## Typography

**Display Font:** Shrikhand (con Bricolage Grotesque y serif de respaldo)
**Body Font:** Bricolage Grotesque (con system-ui, sans-serif de respaldo), ejes `opsz` 12 a 96 y pesos 400, 600, 800

**Character:** Shrikhand es gorda, redonda y de letrero de antojo, con la alegría de una tienda de barrio; Bricolage Grotesque es cálida y un poco irregular, legible en celular sin volverse corporativa.

### Hierarchy
- **Display** (400, `clamp(2.3rem, 9.6vw, 5.2rem)` en móvil y `clamp(3rem, 5.4vw, 5.2rem)` desde 900px, interlineado 1.08): solo el titular del hero. Balanceado y con un halo dorado suave (`text-shadow` de 42px).
- **Headline** (400, `clamp(2.1rem, 5.6vw, 3.8rem)`, 1.1): títulos de sección ("Escoge de la paila", "Combos para compartir", "Así de fácil") y el de la foto.
- **Price** (400, `clamp(2.6rem, 7vw, 3.6rem)`, 1.1, dorado): precio de cada combo. El precio suelto del hero usa la misma fuente a 2rem dentro de su chip.
- **Title** (400, `clamp(1.35rem, 4.6vw, 1.8rem)`, 1.15): nombre de cada sabor; el nombre del combo sube a `clamp(1.8rem, 4.4vw, 2.5rem)`.
- **Body** (400, 1.12rem, 1.45): subtítulo del hero y ayudas de sección, máximo 36 a 52 caracteres de ancho. El párrafo de la foto sube a 1.2rem con 1.5.
- **Label** (800, 1rem): botones, resumen de la canasta, cantidades (con cifras tabulares), "c/u".

### Named Rules
**The Shrikhand Respira Rule.** Toda línea en Shrikhand lleva `padding-bottom` (0.08em o 2px) e interlineado de 1.08 o más, porque la fuente cuelga por debajo y se corta si se aprieta.

**The Dos Voces Rule.** Shrikhand para lo que se lee de lejos (titulares, sabores, precios, marca, teléfono); Bricolage para todo lo demás. Shrikhand siempre en peso 400 y sin cursiva; el énfasis es de color (dorado), no de estilo.

## Layout

Columna única en móvil dentro de un marco de 1200px como máximo, con 16px de margen lateral que pasa a 32px desde 768px. El ritmo vertical es amplio: 72px para la sección de la foto (112px en escritorio), 88px antes de los sabores, 104px antes de los combos y alrededor de los pasos.

- **Hero:** en móvil la paila va primero y el texto debajo; desde 900px el texto queda a la izquierda (5 fracciones) y la paila a la derecha (6 fracciones), con alto mínimo de pantalla completa menos la nav.
- **Foto:** retrato 4:5 con alto máximo de 78vh; desde 900px se pone al lado del texto en 6:5.
- **Sabores:** lista de filas a una columna, dos columnas desde 900px. Cada fila es una grilla de dibujo (76px, 52px bajo 400px de ancho), nombre y control.
- **Canasta:** pegada abajo (`sticky`, 12px del borde) mientras se recorre la lista; en móvil el botón de pedir ocupa todo el ancho debajo, desde 768px queda en la misma línea.
- **Combos:** una columna, dos desde 768px.
- **Pasos:** lista numerada vertical; tres columnas desde 900px con el número arriba.
- **Nav:** pegada arriba, 64px; bajo 480px solo quedan la marca y el botón "Pedir".
- **Flotante:** botón de WhatsApp de 60px abajo a la derecha, escondido mientras el hero o la lista de sabores (que ya tienen botón de pedir) están en pantalla.

Las secciones con ancla dejan 72px de margen al hacer scroll para no quedar bajo la nav.

## Elevation & Depth

La profundidad es de luz, no de capas grises: superficies tonales sobre la noche (`noche` a `noche-2` a `noche-3`), bordes de hilo dorado y sombras largas, difusas y teñidas. La paila tiene su propio teatro de profundidad: fondo de metal, aceite, empanadas, frente de metal encima y vapor por delante de todo.

### Shadow Vocabulary
- **Halo de pedir** (`box-shadow: 0 10px 30px -10px rgba(37, 211, 102, 0.55)`, al pasar el puntero `0 16px 36px -10px rgba(37, 211, 102, 0.7)`): solo botones verdes; el flotante usa `0 12px 30px -8px rgba(37, 211, 102, 0.6)`.
- **Resplandor de foto** (`box-shadow: 0 30px 70px -30px rgba(245, 166, 35, 0.45)`): debajo de la foto real, como si el aceite la iluminara.
- **Sombra de canasta** (`box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.8)`): separa la canasta pegajosa del contenido que pasa por debajo; va con desenfoque de fondo de 12px.
- **Sombra de empanada** (`filter: drop-shadow(0 6px 10px rgba(80, 30, 0, 0.45))` en la paila, `drop-shadow(0 8px 12px rgba(0, 0, 0, 0.45))` en los abanicos): sigue la silueta del SVG.
- **Halo del titular** (`text-shadow: 0 0 42px rgba(255, 170, 40, 0.28)`).

### Named Rules
**The Sombra Teñida Rule.** Ninguna sombra es gris neutra sobre algo dorado o verde: se tiñe del color que la proyecta. El negro se reserva para la canasta, que flota sobre contenido.

## Shapes

Tres radios, cada uno con un trabajo: pill (999px) para todo lo que se toca o se lee como etiqueta (botones, chip de precio, contador, números de pasos, controles de cantidad); 24px para superficies (filas de sabor, tarjetas de combo, canasta); 28px para la foto real, un poco más suave que las superficies para que se sienta como plato. El anillo de foco usa 6px.

La silueta firma es la empanada: media luna de masa con repulgue de bolitas abajo, grumos de fritura y un brillo curvo. En los combos las empanadas se abren en abanico desde un pivote común (giros de 24 grados entre cada una en el x4, 20 en el x6). La paila es una elipse de metal con aceite ovalado y un frente curvo que tapa la base de las empanadas.

### Named Rules
**The Lo Que Se Toca Es Pill Rule.** Si responde al dedo y no es una tarjeta completa, es pill. Las tarjetas que son enlace (combos) llevan dentro su propio botón pill para que el gesto se vea.

## Components

### Buttons
Redondos, gruesos, con rebote.
- **Shape:** pill (999px), alto mínimo 48px; la variante grande sube a 58px.
- **Pedir (primario):** fondo verde, texto tinta de hoja en peso 800, ícono de WhatsApp de 24px a la izquierda, sin salto de línea. En la canasta el texto cambia a "Pedir N por WhatsApp" y el enlace lleva el pedido armado.
- **Hover / Active:** sube 2px y crece 2 % con curva de rebote (`cubic-bezier(0.34, 1.56, 0.64, 1)`, 0.25s), el halo verde crece; al presionar baja 1px y se encoge a 98 %.
- **Foco:** anillo dorado de 3px separado 3px, en todo elemento enfocable.
- **Pedir combo (fantasma):** borde dorado de 1.5px, texto dorado, flecha que avanza 4px cuando el puntero está sobre la tarjeta.

### Controles de cantidad
- **Estilo:** dos círculos de 48px. "Más" es dorado con ícono oscuro; "menos" es carbón con borde de hilo dorado. Iconos SVG de trazo redondeado de 22px.
- **Estados:** crecen 8 % con el puntero, se encogen a 92 % al presionar; deshabilitados al 35 % ("menos" en cero, "más" en 30). La cantidad va en 800 con cifras tabulares y se anuncia con `aria-live`.

### Chip de precio
Pill dorado con "$3.000" en Shrikhand a 2rem y "c/u" en Bricolage 800, texto noche. Solo en el hero, al lado del botón de pedir.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** `noche-2`; la fila escogida pasa a `noche-3` con borde dorado al 50 %; el combo x6 lleva degradé de `combo-brasa` a `noche-2`.
- **Shadow Strategy:** planas en reposo; ver Elevation & Depth.
- **Border:** 1px de hilo dorado; la tarjeta de combo lo vuelve dorado pleno y sube 4px con el puntero.
- **Internal Padding:** 14 a 16px en filas, 28px por 24px en combos.

### Navigation
Barra pegajosa de 64px, noche al 86 % con desenfoque de 10px y borde inferior de hilo dorado. Marca "La Caleñita" en Shrikhand dorado a 1.45rem. Enlaces en crema, peso 600, con subrayado de 2px separado 6px que aparece en dorado al pasar el puntero. A la derecha, el botón de pedir chico.

### La paila (componente firma)
Escena del hero: tres empanadas sumergidas en aceite que se hunden crudas, se doran (`--d` de 0 a 1), saltan girando fuera del aceite y vuelven a entrar crudas, en un ciclo de 9s desfasado 3s entre cada una. Doce burbujas suben y revientan, cuatro nubes de vapor se levantan, y un resplandor ámbar late cada 3.2s. Es decorativa (`aria-hidden`).

### Fila de sabor y canasta (componente firma)
Cada fila entra cruda y se dora en 1.4s cuando aparece en pantalla, una tras otra con 0.12s de diferencia. Al tocar "+" una copia de la empanada vuela en arco girando hasta la canasta (650ms) y la canasta rebota; la empanada de la fila se menea. La canasta resume el total suelto, sugiere los combos desde 4 empanadas sin aplicarlos, y arma el mensaje de WhatsApp con un renglón por sabor.

### Abanico de combo
Cuatro o seis empanadas doradas que se abren en abanico al entrar en pantalla (0.8s con rebote, 50ms entre cada una) y se abren un 25 % más con el puntero.

### Foto del plato
Foto real en retrato con radio de 28px, resplandor dorado debajo y tres nubes de vapor animadas sobre la parte alta. Si la imagen no carga, la figura se esconde completa.

## Do's and Don'ts

### Do:
- **Do** usar la empanada de `#plantillaEmpanada` (vía `data-empanada`) cada vez que haga falta dibujar comida; nunca otra ilustración.
- **Do** expresar fritura y atención animando `--d` (registrada con `@property`, 0 cruda, 1 dorada) en lugar de cambiar colores a mano.
- **Do** mantener pill (999px) para lo tocable, 24px para superficies y 28px para fotos.
- **Do** poner cada animación dentro de `prefers-reduced-motion: no-preference` y dejar un estado quieto y dorado para quien pide menos movimiento.
- **Do** teñir sombras y halos del color que los proyecta (dorado o verde).
- **Do** dar a Shrikhand interlineado de 1.08 o más y su `padding-bottom`.
- **Do** escribir todo en español de Colombia, con el precio en formato `$3.000`.

### Don't:
- **Don't** usar verde fuera de lo que abre WhatsApp.
- **Don't** volver al cartel tipográfico de La Linterna (tintas fluorescentes, letras de madera, esquinas rectas): fue rechazado por no abrir el apetito.
- **Don't** usar fondos negros puros, grises fríos o superficies blancas; la noche siempre es marrón tostado.
- **Don't** poner Shrikhand en cursiva, en negrita sintética ni en texto corrido.
- **Don't** usar íconos de fuente ni emojis como íconos; los íconos son símbolos SVG inline con `currentColor`.
