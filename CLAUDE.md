# La Caleñita — Delicias Vallunas

Sitio web + panel de gestión de pedidos para el negocio de empanadas de Lina.

## Stack
- Vanilla HTML/CSS/JS, sin build
- LocalStorage para persistencia
- Deploy: Cloudflare Pages (arrastrar carpeta)

## Cómo correr local
Abrir `index.html` en el navegador, o servir con `npx serve .`

## Credenciales del panel
- Usuario: `lina`
- Contraseña: `calenita2026`
(Cambiar antes de deploy en `js/auth.js`, constante `CREDENCIALES`)

## Estructura de archivos
```
index.html        Landing pública
login.html        Login del panel
panel.html        Panel admin (5 tabs en un solo HTML)
css/shared.css    Variables, reset, botones, toasts, modales
css/landing.css   Estilos landing
css/panel.css     Estilos panel + login
js/ui.js          Utilidades compartidas: formatoCOP, toasts, confirmar(), fechas, escapar()
js/auth.js        Login/logout/guard (window.Auth)
js/data.js        Capa localStorage + export/import (window.Datos)
js/panel.js       Lógica del panel
js/landing.js     Nav + fallback de logo
images/logo.png   Placeholder generado; reemplazar por el logo real
```

## Estructura de datos
Ver `js/data.js` — todo bajo `localStorage['calenita_datos']`:
`{ pedidos: [], gastos: [], config: { precioEmpanada, ultimoBackup } }`.
Sesión aparte en `localStorage['calenita_sesion']`.
`data.js` cachea en memoria y escribe en cada mutación; `normalizar()` sanea cualquier JSON importado.

## Paleta
Definida en `css/shared.css` como CSS vars.

## Precios y combos
- Suelta: $3.000 · Combo x4: $11.000 · Combo x6: $17.000 (sabores se mezclan libremente).
- `Datos.calcularMejorPrecio(n)` en `js/data.js` devuelve `{precio, desglose:{c6,c4,sueltas}, ahorro}`
  con la combinación más barata. Se usa en el total en vivo del formulario y al guardar el pedido.
- Pedido guarda `total`, `totalEmpanadas`, `desgloseCombo`, `ahorroCombo`.
- Pedidos importados viejos sin `desgloseCombo` se muestran sin etiqueta de combo (no se recalculan).
- Constantes `PRECIO_UNIDAD`, `PRECIO_COMBO_4`, `PRECIO_COMBO_6` en `data.js`; tarjetas de combos
  hardcodeadas en `panel.html` (Nuevo Pedido) e `index.html` (menú) — actualizar ambas si cambian precios.

Sabores: Papa Carne, Papa Pollo, Ranchera, Queso, Mexicana.
Lista de sabores en `Datos.SABORES` (`js/data.js`) — única fuente de verdad para el panel.
La landing tiene el menú hardcodeado en `index.html`.

## WhatsApp
3160996970 (enlaces `wa.me/573160996970` en `index.html`)

## Backup
Lina debe exportar el JSON cada 7 días desde la tab "Backup".
Banner amarillo aparece en todas las tabs si `ultimoBackup` es null o > 7 días (`DIAS_BACKUP` en `panel.js`).

## Rifa
Cada pedido recibe `numeroRifa` de 4 dígitos único al crearse. "Reiniciar rifa" pone `numeroRifa = null`
en todos los pedidos; los pedidos nuevos vuelven a recibir número.

## Reglas de estilo
- Fredoka para títulos, Nunito para cuerpo
- Mobile-first, botones grandes tipo pill (min 48px)
- Inputs a 16px para evitar zoom en iOS
- Confetti festivo caleño, sin excederse (confeti manual con divs, sin librerías)
- Todo en español de Colombia
- Nunca inyectar texto de usuario sin `UI.escapar()`
- Footer: "Hecho con amor por JuanCode 💛"
