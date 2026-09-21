/* ==========================================================
   token.js — firma y verificación del token del panel.
   Token = base64url(payload).base64url(HMAC-SHA256(payload))
   payload = { u: usuario, exp: ms epoch }
   Las carpetas y archivos con guion bajo no se publican como ruta.
   ========================================================== */

const DIAS_VIGENCIA = 30;

function b64urlDesdeBytes(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDesdeTexto(txt) {
  return b64urlDesdeBytes(new TextEncoder().encode(txt));
}

function textoDesdeB64url(s) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '==='.slice((pad.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function clave(secreto) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function firmar(payloadB64, secreto) {
  const mac = await crypto.subtle.sign('HMAC', await clave(secreto), new TextEncoder().encode(payloadB64));
  return b64urlDesdeBytes(new Uint8Array(mac));
}

// Comparación en tiempo constante: no filtra por cuántos caracteres coinciden
function igualesSeguro(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function crearToken(usuario, secreto) {
  const payload = b64urlDesdeTexto(JSON.stringify({
    u: usuario,
    exp: Date.now() + DIAS_VIGENCIA * 86400000
  }));
  return payload + '.' + (await firmar(payload, secreto));
}

// Devuelve el payload si el token es válido y no venció; null si no.
export async function verificarToken(token, secreto) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const esperada = await firmar(partes[0], secreto);
  if (!igualesSeguro(partes[1], esperada)) return null;
  try {
    const payload = JSON.parse(textoDesdeB64url(partes[0]));
    if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Compara credenciales sin filtrar tiempos
export function credencialesOk(usuario, clave_, env) {
  const u = String(usuario || '');
  const c = String(clave_ || '');
  const uOk = igualesSeguro(u, String(env.PANEL_USUARIO || ''));
  const cOk = igualesSeguro(c, String(env.PANEL_CLAVE || ''));
  return uOk && cOk;
}
