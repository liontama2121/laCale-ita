/* ==========================================================
   auth.js — login, logout y guard de sesión
   Cambiar CREDENCIALES antes de deploy.
   ========================================================== */
(function (global) {
  'use strict';

  var CREDENCIALES = {
    usuario: 'lina',
    clave: 'calenita2026'
  };

  var KEY_SESION = 'calenita_sesion';
  // Sesión expira a los 30 días de inactividad
  var DURACION_MS = 30 * 24 * 60 * 60 * 1000;

  function leerSesion() {
    try {
      var raw = localStorage.getItem(KEY_SESION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function haySesion() {
    var s = leerSesion();
    if (!s || !s.activa) return false;
    if (Date.now() - (s.inicio || 0) > DURACION_MS) {
      cerrarSesion(false);
      return false;
    }
    return true;
  }

  function iniciarSesion(usuario, clave) {
    var u = String(usuario || '').trim().toLowerCase();
    var c = String(clave || '');
    if (u === CREDENCIALES.usuario && c === CREDENCIALES.clave) {
      localStorage.setItem(KEY_SESION, JSON.stringify({
        activa: true,
        usuario: 'Lina',
        inicio: Date.now()
      }));
      return true;
    }
    return false;
  }

  function cerrarSesion(redirigir) {
    localStorage.removeItem(KEY_SESION);
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

    if (btnVer) {
      btnVer.addEventListener('click', function () {
        var esPass = inputClave.type === 'password';
        inputClave.type = esPass ? 'text' : 'password';
        btnVer.textContent = esPass ? '🙈' : '👁️';
        btnVer.setAttribute('aria-label', esPass ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (iniciarSesion(inputUsuario.value, inputClave.value)) {
        window.location.href = 'panel.html';
      } else {
        if (global.mostrarToast) {
          global.mostrarToast('Usuario o contraseña incorrectos', 'error');
        }
        inputClave.value = '';
        inputClave.focus();
        form.classList.remove('sacudir');
        void form.offsetWidth; // reinicia animación
        form.classList.add('sacudir');
      }
    });
  });
})(window);
