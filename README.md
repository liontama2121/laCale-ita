# 🥟 La Caleñita — Delicias Vallunas

Landing pública + panel administrativo para el negocio de empanadas.
Sin frameworks, sin build: HTML, CSS y JavaScript puros.

## Correr en local

Opción 1 — doble clic en `index.html`.

Opción 2 — servidor local (recomendado para probar el login/panel):

```bash
npx serve .
# abre http://localhost:3000
```

## Páginas

| Archivo | Qué es |
|---|---|
| `index.html` | Landing pública con menú y botón de WhatsApp |
| `login.html` | Ingreso al panel |
| `panel.html` | Panel: Nuevo Pedido · Pedidos · Finanzas · Rifa · Backup |

Credenciales por defecto: usuario `lina`, contraseña `calenita2026`.
**Cámbialas antes de publicar** en `js/auth.js` (constante `CREDENCIALES`).

## Desplegar en Cloudflare Pages

1. Entra a [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Ponle nombre al proyecto (ej. `lacalenita`).
3. Arrastra **toda esta carpeta** (con `index.html` en la raíz).
4. Deploy. Queda en `https://lacalenita.pages.dev`.

Para actualizar: repite el upload. No hay build ni variables de entorno.

## Datos y backup

Todo se guarda en el `localStorage` del navegador del celular de Lina (`calenita_datos`).
Eso significa:

- Los datos viven **solo en ese navegador**. Si cambia de celular o borra datos del navegador, se pierden.
- Por eso la tab **Backup** exporta un `calenita-backup-YYYY-MM-DD.json`. Guardarlo en Drive o enviarlo por WhatsApp **cada semana**.
- El panel muestra un banner amarillo cuando pasan 7 días sin exportar.
- Importar un JSON reemplaza todos los datos actuales (pide confirmación).

## Logo

`images/logo.png` es un placeholder generado. Reemplázalo por el logo real (recomendado: PNG cuadrado, 512×512).

## Estructura

```
├── index.html
├── login.html
├── panel.html
├── css/  shared.css · landing.css · panel.css
├── js/   ui.js · auth.js · data.js · panel.js · landing.js
├── images/logo.png
├── CLAUDE.md
└── README.md
```

---
Hecho con amor por JuanCode 💛
