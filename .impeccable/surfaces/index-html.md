---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Landing pública (index.html)

Modo: Persuade. Visitante: vecinos de varios conjuntos del barrio, en el celular, muchas veces desde un enlace de WhatsApp, con hambre y poco tiempo. Acción: abrir WhatsApp con el pedido (número 3160996970).
Prueba/contenido: precios reales ($3.000 suelta, combo x4 $11.000, combo x6 $17.000), cinco sabores (Papa Carne, Papa Pollo, Ranchera, Queso, Mexicana), domicilio a conjunto, torre y apto, y una foto real del plato (`images/empanadas.jpg`, procedencia en `images/CREDITOS.txt`). Horarios y zona exacta de domicilio desconocidos: no se publican.
Restricciones: sin build, sin dependencias JS, shared.css lo comparte el panel (todo el estilo de la landing va bajo `.landing`), footer de JuanCode intacto.

## Direction contract

THESIS: La Caleñita vendida por el antojo, no por el cartel: una freidora de noche donde las empanadas se doran frente a ti y saltan a tu canasta. Rechaza tanto la landing de comida estándar como el cartel tipográfico anterior, que no abría el apetito.

OWN-WORLD: Cocina a oscuras en marrones tostados (`#120C07`, `#1C130B`, `#2A1C10`), una sola luz que es el aceite dorado (`#FFC93D`), texto en crema de masa. Empanada SVG hecha a mano que pasa de pálida a dorada con la propiedad registrada `--d`; burbujas, vapor y resplandor ámbar. Shrikhand para titulares, sabores y precios; Bricolage Grotesque para el resto. Lo tocable es pill, superficies a 24px, la foto real a 28px. Verde solo para pedir.

STORY: Ve las empanadas friéndose y el precio en el primer vistazo; confirma con la foto real que así salen de la cocina de Lina; escoge sabores tocando "+" y ve cada empanada volar a la canasta, que le arma el mensaje; si quiere, pide un combo; entiende en tres pasos que le llegan calienticas al apto; manda el pedido por WhatsApp.

FIRST VIEWPORT: En el celular, la paila arriba con tres empanadas que se hunden crudas, se doran y saltan del aceite entre burbujas y vapor; debajo, "Empanadas vallunas, recién fritas" en Shrikhand con "recién fritas" en dorado, la línea de los cinco sabores, el chip dorado "$3.000 c/u" y el botón verde "Pedir por WhatsApp", todo sin scroll. En escritorio el texto va a la izquierda y la paila a la derecha a pantalla completa.

FORM: "La freidora de noche", elegida por el usuario entre tres opciones ofrecidas después de que rechazó el mundo de cartel por no ser apetitoso. Sin tirada de semilla. Interacción firma: la fila de cada sabor entra cruda y se dora al aparecer, y cada "+" lanza una empanada en arco hasta la canasta pegajosa, que arma el mensaje de WhatsApp sabor por sabor; los combos se abren en abanico.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
