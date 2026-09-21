/* ==========================================================
   api.js — cliente de la API (/api/*) y guardado del token.
   El token se firma en el servidor; acá solo se guarda y se manda.
   ========================================================== */
(function (global) {
  'use strict';

  var KEY_TOKEN = 'calenita_token';
  var BASE = '/api';

  function leerToken() {
    try {
      return localStorage.getItem(KEY_TOKEN) || '';
    } catch (e) {
      return '';
    }
  }

  function guardarToken(t) {
    try {
      if (t) localStorage.setItem(KEY_TOKEN, t);
      else localStorage.removeItem(KEY_TOKEN);
    } catch (e) { /* modo privado: la sesión dura lo que la pestaña */ }
  }

  function hayToken() {
    return !!leerToken();
  }

  // Error con bandera `red` para distinguir "sin internet" de "el servidor dijo que no"
  function errorRed(msg) {
    var e = new Error(msg);
    e.red = true;
    return e;
  }

  var TOPE_MS = 15000; // sin esto, una red que no responde deja la sync trabada

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    var cabeceras = { 'content-type': 'application/json' };
    var t = leerToken();
    if (t) cabeceras.authorization = 'Bearer ' + t;

    var control = typeof AbortController === 'function' ? new AbortController() : null;
    var reloj = setTimeout(function () { if (control) control.abort(); }, TOPE_MS);

    return fetch(BASE + ruta, {
      method: opciones.method || 'GET',
      headers: cabeceras,
      body: opciones.body ? JSON.stringify(opciones.body) : undefined,
      signal: control ? control.signal : undefined
    }).catch(function () {
      clearTimeout(reloj);
      throw errorRed('Sin conexión');
    }).then(function (res) {
      clearTimeout(reloj);
      return res.json().catch(function () { return {}; }).then(function (datos) {
        if (res.status === 401) {
          guardarToken('');
          var e401 = new Error(datos.error || 'Sesión vencida');
          e401.noAutorizado = true;
          throw e401;
        }
        if (!res.ok) throw new Error(datos.error || ('Error ' + res.status));
        return datos;
      });
    });
  }

  function login(usuario, clave) {
    return pedir('/login', { method: 'POST', body: { usuario: usuario, clave: clave } })
      .then(function (r) {
        guardarToken(r.token);
        return r;
      });
  }

  function bajar(desde) {
    return pedir('/sync?desde=' + encodeURIComponent(desde || 0));
  }

  function subir(cuerpo) {
    return pedir('/sync', { method: 'POST', body: cuerpo });
  }

  global.Api = {
    login: login,
    bajar: bajar,
    subir: subir,
    hayToken: hayToken,
    leerToken: leerToken,
    guardarToken: guardarToken
  };
})(window);
