/* ==========================================================
   POST /api/login  { usuario, clave } → { token }
   La contraseña vive solo en los secretos del proyecto, nunca en el JS del panel.
   ========================================================== */
import { crearToken, credencialesOk } from '../_shared/token.js';

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return json({ error: 'Usá POST' }, 405);

  let cuerpo;
  try {
    cuerpo = await ctx.request.json();
  } catch (e) {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  if (!credencialesOk(cuerpo && cuerpo.usuario, cuerpo && cuerpo.clave, ctx.env)) {
    // Retardo corto: encarece probar contraseñas a lo bruto
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: 'Usuario o contraseña incorrectos' }, 401);
  }

  return json({
    token: await crearToken(String(cuerpo.usuario), ctx.env.TOKEN_SECRET),
    usuario: 'Lina'
  });
}
