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
- Suelta: $3.000 · Combo x4: $11.000 · Combo x6: $17.000.
- **Los combos NO se aplican automáticamente.** 10 sueltas = $30.000. Un combo existe solo si Lina lo agrega
  con el botón "+ Combo x4/x6" en el formulario; cada combo elige sus propios sabores y debe estar completo
  (exactamente 4 o 6) para registrar el pedido.
- `Datos.cotizar(sueltas, combos)` en `js/data.js` devuelve `{precio, totalEmpanadas, ahorro, desglose, errores}`.
  Se usa en el total en vivo y al guardar. `errores` no vacío = combo incompleto → botón Registrar deshabilitado.
- Pedido guarda `sabores` (totales sueltas+combos, para resumen y conteo), `sueltas`, `combos:[{tipo,precio,sabores}]`,
  `total`, `totalEmpanadas`, `desgloseCombo`, `ahorroCombo`.
- Pedidos viejos sin `combos` se muestran con `sabores` totales (compatibles).
- Constantes `PRECIO_UNIDAD`, `PRECIO_COMBO_4`, `PRECIO_COMBO_6` en `data.js`; tarjetas y botones de combos
  hardcodeados en `panel.html` e `index.html` — actualizar si cambian precios.

Sabores: Papa Carne, Papa Pollo, Ranchera, Queso, Mexicana.
Lista de sabores en `Datos.SABORES` (`js/data.js`) — única fuente de verdad para el panel.
La landing tiene el menú hardcodeado en `index.html`.

## Clientes
No hay tabla de clientes: se derivan de `pedidos` con `Datos.clientes()` / `Datos.buscarCliente(nombre)` (`js/data.js`).
Clave sin tildes/mayúsculas/espacios dobles ("María" = "maria"). Al registrar pedido de un cliente existente se reutiliza
el nombre tal como está guardado. El input `#pCliente` tiene `<datalist>` con sugerencias y autollena conjunto/torre/apto
solo si están vacíos. Nada de esto modifica pedidos viejos.

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
