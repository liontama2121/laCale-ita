# La Caleñita — Delicias Vallunas

Sitio web + panel de gestión de pedidos para el negocio de empanadas de Lina.

## Stack
- Vanilla HTML/CSS/JS, sin build
- Cloudflare D1 (SQLite) como fuente de verdad compartida entre equipos
- LocalStorage como caché local + cola offline
- API en Pages Functions (`functions/api/`)
- Deploy: `npx wrangler pages deploy .` (ya NO se arrastra la carpeta)

## Cómo correr local
```
npx wrangler pages dev . --port 8788
```
Necesita `.dev.vars` (no versionado) con `PANEL_USUARIO`, `PANEL_CLAVE`, `TOKEN_SECRET`.
Base local: `npx wrangler d1 execute calenita --local --file=migrations/0001_inicial.sql`
`index.html` suelto en el navegador sigue funcionando para ver la landing, pero el panel necesita la API.

## Credenciales del panel
La contraseña NO está en el código: vive en los secretos del proyecto de Pages.
```
npx wrangler pages secret put PANEL_CLAVE --project-name=empanadacale
npx wrangler pages secret put PANEL_USUARIO --project-name=empanadacale
npx wrangler pages secret put TOKEN_SECRET --project-name=empanadacale
```
`TOKEN_SECRET` firma los tokens de sesión (HMAC-SHA256, 30 días). Si se cambia, todos los equipos
tienen que entrar de nuevo.

> La clave vieja `calenita2026` estuvo en el JS de un repo público: quedó comprometida para siempre.
> La de producción tiene que ser otra.

## Estructura de archivos
```
index.html        Landing pública
login.html        Login del panel
panel.html        Panel admin (5 tabs en un solo HTML)
css/shared.css    Variables, reset, botones, toasts, modales
css/landing.css   Estilos landing
css/panel.css     Estilos panel + login
js/ui.js          Utilidades compartidas: formatoCOP, toasts, confirmar(), fechas, escapar()
js/api.js         Cliente de /api/* + token (window.Api)
js/auth.js        Login/logout/guard contra /api/login (window.Auth)
js/data.js        Caché local + cola offline + sincronización con D1 (window.Datos)
js/panel.js       Lógica del panel
js/landing.js     Nav + fallback de logo
images/logo.png   Placeholder generado; reemplazar por el logo real

functions/api/_middleware.js   Verifica el token en todo /api/* (menos /api/login)
functions/api/login.js         POST usuario+clave → token firmado
functions/api/sync.js          GET/POST de sincronización contra D1
functions/_shared/token.js     Firma y verificación HMAC (carpeta con _ = no se publica)
migrations/0001_inicial.sql    Esquema de D1
wrangler.jsonc                 Binding DB + config de Pages
.dev.vars                      Secretos LOCALES (no versionado)
backups/                       Exports con datos de clientas (NO versionado, repo público)
```

## Estructura de datos
Fuente de verdad: **D1** (`migrations/0001_inicial.sql`) — tablas `pedidos`, `gastos`, `config`.
Caché local en `localStorage['calenita_datos']`:
`{ pedidos: [], gastos: [], config: { precioEmpanada, ultimoBackup } }`.
Cola de sincronización en `localStorage['calenita_sync']`: `{ cursor, pendientes }`.
Token de sesión en `localStorage['calenita_token']`, nombre en `localStorage['calenita_sesion']`.
`data.js` cachea en memoria y escribe en cada mutación; `normalizar()` sanea cualquier JSON importado.

## Sincronización entre equipos
- `GET /api/sync?desde=<cursor>` trae lo que cambió; `POST /api/sync` sube la cola y trae lo nuevo.
- El panel sincroniza al abrir, cada **10 s**, al volver a la pestaña y al recuperar la conexión.
- `actualizado` (ms, reloj del **servidor**) es el cursor. Gana la última escritura que llega.
- Los borrados son lápidas (`borrado = 1`), nunca se borra la fila: así el borrado viaja a los demás equipos.
- Los ids son UUID (`crypto.randomUUID`). Los correlativos viejos chocaban entre equipos; `normalizar()`
  los pasa a texto y siguen funcionando.
- Sin internet Lina registra igual: queda en la cola (`N sin subir` en la topbar) y sube solo al volver.
- El número de rifa lo revalida el servidor: si dos equipos sortean el mismo, al segundo se le reasigna.
- Indicador en la topbar: verde al día · amarillo con pendientes · gris sin internet · rojo error.

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
Con D1 los datos ya no dependen de un solo navegador, pero el export sigue sirviendo de respaldo frío.
Lina debe exportar el JSON cada 7 días desde la tab "Backup".
Banner amarillo aparece en todas las tabs si `ultimoBackup` es null o > 7 días (`DIAS_BACKUP` en `panel.js`).
D1 además tiene Time Travel (recuperación a un punto en el tiempo, 7 días en plan free):
`npx wrangler d1 time-travel restore calenita --timestamp=...`

Importar un JSON **reemplaza** la caché local y sube todo como upsert: pisa lo que haya en D1.
Los exports van a `backups/`, que está en `.gitignore` porque el repo es público y traen nombres
y direcciones de clientas.

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
