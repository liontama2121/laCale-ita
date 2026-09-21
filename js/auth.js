/* ==========================================================
   auth.js — login, logout y guard de sesión.
   La contraseña ya NO vive acá: la valida /api/login contra los secretos
   del proyecto. Este archivo solo guarda el token que devuelve el servidor.
   Cambiar la clave: npx wrangler pages secret put PANEL_CLAVE
   ========================================================== */
(function (global) {
  'use strict';

  var KEY_SESION = 'calenita_sesion';

  function leerSesion() {
    try {
      var raw = localStorage.getItem(KEY_SESION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // El token trae su propio vencimiento firmado; si venció, la API responde 401
  // y Api borra el token. Offline seguimos adentro con lo que hay en caché.
  function haySesion() {
    return global.Api ? global.Api.hayToken() : false;
  }

  function iniciarSesion(usuario, clave) {
    return global.Api.login(String(usuario || '').trim(), String(clave || ''))
      .then(function (r) {
        try {
          localStorage.setItem(KEY_SESION, JSON.stringify({
            activa: true,
            usuario: r.usuario || 'Lina',
            inicio: Date.now()
          }));
        } catch (e) { /* sin localStorage igual quedó el token en memoria */ }
        return true;
      });
  }

  function cerrarSesion(redirigir) {
    localStorage.removeItem(KEY_SESION);
    if (global.Api) global.Api.guardarToken('');
    if (redirigir !== false) window.location.href = 'login.html';
  }

  // Redirige a login si no hay sesión. Llamar al inicio de panel.
  function requerirSesion() {
    if (!haySesion()) {
      window.location.replace('login.html');
      return false;
    }
    return true;
  }

  function nombreUsuario() {
    var s = leerSesion();
    return (s && s.usuario) || 'Lina';
  }

  global.Auth = {
    haySesion: haySesion,
    iniciarSesion: iniciarSesion,
    cerrarSesion: cerrarSesion,
    requerirSesion: requerirSesion,
    nombreUsuario: nombreUsuario
  };

  // ---------- Lógica de la página login.html ----------
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('formLogin');
    if (!form) return;

    // Si ya tiene sesión, ir directo al panel
    if (haySesion()) {
      window.location.replace('panel.html');
      return;
    }

    var inputUsuario = document.getElementById('usuario');
    var inputClave = document.getElementById('clave');
    var btnVer = document.getElementById('btnVerClave');
    var btnEntrar = form.querySelector('button[type="submit"]');

    if (btnVer) {
      btnVer.addEventListener('click', function () {
        var esPass = inputClave.type === 'password';
        inputClave.type = esPass ? 'text' : 'password';
        btnVer.textContent = esPass ? '🙈' : '👁️';
        btnVer.setAttribute('aria-label', esPass ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    }

    function fallar(msg) {
      if (global.mostrarToast) global.mostrarToast(msg, 'error');
      inputClave.value = '';
      inputClave.focus();
      form.classList.remove('sacudir');
      void form.offsetWidth; // reinicia animación
      form.classList.add('sacudir');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btnEntrar.disabled) return;
      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Entrando…';

      iniciarSesion(inputUsuario.value, inputClave.value)
        .then(function () {
          window.location.href = 'panel.html';
        })
        .catch(function (err) {
          btnEntrar.disabled = false;
          btnEntrar.textContent = 'Entrar';
          fallar(err && err.red ? 'Sin internet: la primera entrada necesita conexión' : (err.message || 'No se pudo entrar'));
        });
    });
  });
})(window);
