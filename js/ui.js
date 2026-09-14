/* ==========================================================
   ui.js — utilidades de interfaz compartidas (login + panel)
   toasts, formato COP, confirmaciones, fechas
   ========================================================== */
(function (global) {
  'use strict';

  // ---------- Formato de moneda COP ----------
  var fmtCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  function formatoCOP(n) {
    return fmtCOP.format(Number(n) || 0);
  }

  // ---------- Fechas ----------
  function pad(n) { return String(n).padStart(2, '0'); }

  // dd/mm HH:mm
  function fechaCorta(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  // dd/mm/yyyy
  function fechaLarga(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  // yyyy-mm-dd en hora local (para inputs type=date)
  function hoyISO(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // ---------- Toasts ----------
  function contenedorToasts() {
    var c = document.getElementById('toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toasts';
      c.className = 'toasts';
      c.setAttribute('aria-live', 'polite');
      document.body.appendChild(c);
    }
    return c;
  }

  function mostrarToast(mensaje, tipo, duracion) {
    tipo = tipo || 'exito';
    duracion = duracion || 3000;
    var c = contenedorToasts();
    var t = document.createElement('div');
    t.className = 'toast toast-' + tipo;
    t.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    t.textContent = mensaje;
    c.appendChild(t);
    setTimeout(function () {
      t.classList.add('toast-saliendo');
      setTimeout(function () { t.remove(); }, 260);
    }, duracion);
  }

  // ---------- Confirmación con modal (Promise<boolean>) ----------
  function confirmar(opciones) {
    opciones = opciones || {};
    return new Promise(function (resolve) {
      var fondo = document.createElement('div');
      fondo.className = 'modal-fondo';
      fondo.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="confTitulo">' +
          '<h3 id="confTitulo"></h3>' +
          '<p class="centrado" id="confMensaje"></p>' +
          (opciones.textoRequerido
            ? '<label class="campo"><span>Escribe <strong>' + opciones.textoRequerido + '</strong> para confirmar</span>' +
              '<input type="text" id="confInput" autocomplete="off" autocapitalize="characters"></label>'
            : '') +
          '<div class="modal-acciones">' +
            '<button type="button" class="btn btn-outline" id="confCancelar"></button>' +
            '<button type="button" class="btn" id="confAceptar"></button>' +
          '</div>' +
        '</div>';

      fondo.querySelector('#confTitulo').textContent = opciones.titulo || '¿Estás segura?';
      fondo.querySelector('#confMensaje').textContent = opciones.mensaje || '';
      var btnCancelar = fondo.querySelector('#confCancelar');
      var btnAceptar = fondo.querySelector('#confAceptar');
      var input = fondo.querySelector('#confInput');
      btnCancelar.textContent = opciones.textoCancelar || 'Cancelar';
      btnAceptar.textContent = opciones.textoAceptar || 'Sí, continuar';
      btnAceptar.classList.add(opciones.peligro ? 'btn-rojo' : 'btn-naranja');

      if (input) {
        btnAceptar.disabled = true;
        input.addEventListener('input', function () {
          btnAceptar.disabled = input.value.trim().toUpperCase() !== opciones.textoRequerido.toUpperCase();
        });
      }

      function cerrar(valor) {
        fondo.remove();
        document.removeEventListener('keydown', alTeclado);
        resolve(valor);
      }
      function alTeclado(e) { if (e.key === 'Escape') cerrar(false); }

      btnCancelar.addEventListener('click', function () { cerrar(false); });
      btnAceptar.addEventListener('click', function () { cerrar(true); });
      fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrar(false); });
      document.addEventListener('keydown', alTeclado);

      document.body.appendChild(fondo);
      (input || btnCancelar).focus();
    });
  }

  // ---------- Escape HTML para inyectar texto de usuario ----------
  function escapar(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  global.UI = {
    formatoCOP: formatoCOP,
    fechaCorta: fechaCorta,
    fechaLarga: fechaLarga,
    hoyISO: hoyISO,
    mostrarToast: mostrarToast,
    confirmar: confirmar,
    escapar: escapar
  };
  global.mostrarToast = mostrarToast;
})(window);
