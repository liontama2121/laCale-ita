/* ==========================================================
   _middleware.js — corre antes de toda ruta /api/*
   Verifica el token (salvo en /api/login) y normaliza los errores a JSON.
   ========================================================== */
import { verificarToken } from '../_shared/token.js';

const PUBLICAS = ['/api/login'];

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);

  if (!ctx.env.TOKEN_SECRET || !ctx.env.PANEL_CLAVE) {
    return json({ error: 'API sin configurar: faltan los secretos del panel' }, 500);
  }

  if (!PUBLICAS.includes(url.pathname)) {
    const cab = ctx.request.headers.get('authorization') || '';
    const token = cab.startsWith('Bearer ') ? cab.slice(7) : '';
    const payload = await verificarToken(token, ctx.env.TOKEN_SECRET);
    if (!payload) return json({ error: 'Sesión vencida o inválida' }, 401);
    ctx.data.usuario = payload.u;
  }

  try {
    return await ctx.next();
  } catch (e) {
    console.error('Error en', url.pathname, e && e.stack);
    return json({ error: 'Error del servidor' }, 500);
  }
}
