# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Vecinos de varios conjuntos residenciales del barrio donde vive Lina. Ven la página casi siempre en el celular,
muchas veces desde un enlace compartido por WhatsApp, con hambre y poco tiempo. Su trabajo: saber qué sabores hay,
cuánto cuestan y pedir sin fricción.

## Product Purpose
La Caleñita vende empanadas vallunas hechas por Lina, a domicilio dentro del barrio. La landing existe para
convertir una visita en un mensaje de WhatsApp con el pedido. Éxito = el visitante abre el chat de WhatsApp.

## Positioning
Empanada valluna de verdad (receta caleña) hecha por una vecina, fuera del Valle. Se pide por chat directo a
Lina y llega calientica a la puerta del apartamento con su salsita.

## Operating Context
- Pedido por WhatsApp a 3160996970 (`wa.me/573160996970`). No hay carrito ni pagos en la web.
- La dirección se da como conjunto, torre y apartamento.
- Lina registra los pedidos en el panel (`panel.html`); la landing no depende de la API.

## Capabilities and Constraints
- Precios: suelta $3.000 · combo x4 $11.000 · combo x6 $17.000. Los combos se piden explícitamente.
- Sabores: Papa Carne, Papa Pollo, Ranchera, Queso, Mexicana. Salsita incluida.
- Vanilla HTML/CSS/JS sin build, Cloudflare Pages. Landing estática.
- Todo en español de Colombia. Mobile-first, botones mínimo 48px, inputs 16px.
- Sin dependencias nuevas sin consultar.
- Indeciso: si Instagram/TikTok están activos; si la rifa se anuncia en la landing; horarios y zona exacta.

## Brand Commitments
- Nombre "La Caleñita", lema "Delicias Vallunas".
- Footer obligatorio: "Hecho con amor por JuanCode 💛".
- Tono cercano, caleño, festivo sin exagerar.

## Evidence on Hand
- `images/logo.png`: placeholder generado, no es el logo definitivo.
- `images/empanadas.jpg`: foto real de las empanadas de Lina (copia de `empanada.jpeg`).
- No hay testimonios, reseñas ni cifras de ventas: no inventarlos.

## Product Principles
1. El chat de WhatsApp es el único destino; todo en la página empuja hacia él.
2. Precio y sabores visibles en segundos, sin leer párrafos.
3. Se siente hecho por una vecina, no por una cadena.
4. Rápida en un celular de gama media con datos móviles.
