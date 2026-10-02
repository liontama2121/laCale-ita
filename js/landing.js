/* landing.js: interacciones de la landing pública ("La freidora de noche") */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var WA_NUMERO = '573160996970';
  var PRECIO_UNIDAD = 3000;
  var MAX_POR_SABOR = 30;
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatoCOP(n) {
    return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /* ---------- Empanadas ilustradas: una copia de la plantilla en cada [data-empanada] ---------- */
  var plantilla = document.getElementById('plantillaEmpanada');
  function nuevaEmpanada() {
    return plantilla.content.firstElementChild.cloneNode(true);
  }
  if (plantilla) {
    document.querySelectorAll('[data-empanada]').forEach(function (el) {
      el.appendChild(nuevaEmpanada());
    });
  }

  /* ---------- Fotos: si alguna no carga, se quita su marco ---------- */
  document.querySelectorAll('figure img').forEach(function (img) {
    var quitar = function () { img.closest('figure').hidden = true; };
    if (img.complete && img.naturalWidth === 0) quitar();
    else img.addEventListener('error', quitar);
  });

  /* ---------- Revelado y fritura al hacer scroll ---------- */
  var revelables = document.querySelectorAll('.sec-titulo, .sec-ayuda, .plato-foto, .plato-texto, .combo, .ruta-pasos li');
  revelables.forEach(function (el) { el.setAttribute('data-revelar', ''); });
  var filasSabor = Array.prototype.slice.call(document.querySelectorAll('.sabor'));

  if ('IntersectionObserver' in window && !sinMovimiento) {
    var observadorRevelar = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    revelables.forEach(function (el) { observadorRevelar.observe(el); });

    // Cada sabor entra crudo y se dora cuando aparece en pantalla
    var observadorDorar = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = filasSabor.indexOf(e.target);
        e.target.style.transitionDelay = (i * 0.12) + 's';
        e.target.classList.add('dorada');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    filasSabor.forEach(function (el) { observadorDorar.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add('visible'); });
    filasSabor.forEach(function (el) { el.classList.add('dorada'); });
  }

  /* ---------- Canasta: armar el pedido para WhatsApp ---------- */
  var resumen = document.getElementById('pedidoResumen');
  var pista = document.getElementById('pedidoPista');
  var btn = document.getElementById('pedidoBtn');
  var btnTexto = document.getElementById('pedidoBtnTexto');
  var canastaIcono = document.getElementById('canastaIcono');
  var canastaN = document.getElementById('canastaN');
  var cantidades = {};

  function pintarPedido() {
    var total = 0;
    var lineasMsg = [];
    filasSabor.forEach(function (fila) {
      var sabor = fila.getAttribute('data-sabor');
      var n = cantidades[sabor] || 0;
      total += n;
      fila.querySelector('.sabor-cant').textContent = n;
      fila.querySelector('[data-accion="menos"]').disabled = n === 0;
      fila.querySelector('[data-accion="mas"]').disabled = n >= MAX_POR_SABOR;
      fila.classList.toggle('escogido', n > 0);
      if (n > 0) lineasMsg.push('- ' + n + ' ' + sabor);
    });
    canastaN.textContent = total;

    var mensaje;
    if (total === 0) {
      resumen.textContent = 'Tu canasta está vacía. Mezcla los sabores como quieras.';
      pista.hidden = true;
      btnTexto.textContent = 'Pedir por WhatsApp';
      mensaje = 'Hola Caleñita, quiero pedir empanadas';
    } else {
      var palabra = total === 1 ? 'empanada' : 'empanadas';
      resumen.textContent = '';
      var fuerte = document.createElement('strong');
      fuerte.textContent = total + ' ' + palabra;
      resumen.appendChild(fuerte);
      resumen.appendChild(document.createTextNode(' sueltas: ' + formatoCOP(total * PRECIO_UNIDAD)));
      if (total >= 4) {
        pista.hidden = false;
        pista.innerHTML = 'Pídelas en <strong>combo x4 ($11.000)</strong> o <strong>x6 ($17.000)</strong> y ahorras. Díselo a Lina en el mensaje.';
      } else {
        pista.hidden = true;
      }
      btnTexto.textContent = 'Pedir ' + total + ' por WhatsApp';
      mensaje = 'Hola Caleñita, quiero pedir:\n' + lineasMsg.join('\n') + '\nTotal: ' + total + ' ' + palabra;
    }
    btn.href = 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(mensaje);
  }

  function saltarCanasta() {
    canastaIcono.classList.remove('salto');
    void canastaIcono.offsetWidth; // reinicia la animación
    canastaIcono.classList.add('salto');
  }

  // La empanada del sabor vuela en arco hasta la canasta
  function volarACanasta(fila) {
    var origen = fila.querySelector('.sabor-dibujo').getBoundingClientRect();
    var destino = canastaIcono.getBoundingClientRect();
    if (sinMovimiento || !origen.width || !destino.width || !document.body.animate) {
      saltarCanasta();
      return;
    }
    var voladora = document.createElement('div');
    voladora.className = 'voladora';
    voladora.style.left = origen.left + 'px';
    voladora.style.top = origen.top + 'px';
    voladora.style.width = origen.width + 'px';
    voladora.appendChild(nuevaEmpanada());
    document.body.appendChild(voladora);

    var dx = destino.left + destino.width / 2 - (origen.left + origen.width / 2);
    var dy = destino.top + destino.height / 2 - (origen.top + origen.height / 2);
    var alto = Math.min(-60, dy * 0.25 - 80);
    var vuelo = voladora.animate([
      { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
      { transform: 'translate(' + dx * 0.5 + 'px, ' + (dy * 0.5 + alto) + 'px) rotate(-200deg) scale(0.9)', offset: 0.5 },
      { transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(-380deg) scale(0.35)' }
    ], { duration: 650, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
    vuelo.onfinish = function () {
      voladora.remove();
      saltarCanasta();
    };
  }

  filasSabor.forEach(function (fila) {
    var sabor = fila.getAttribute('data-sabor');
    cantidades[sabor] = 0;
    fila.addEventListener('click', function (e) {
      var boton = e.target.closest('.sabor-btn');
      if (!boton || boton.disabled) return;
      var suma = boton.getAttribute('data-accion') === 'mas';
      cantidades[sabor] = Math.max(0, Math.min(MAX_POR_SABOR, cantidades[sabor] + (suma ? 1 : -1)));
      pintarPedido();
      if (suma) volarACanasta(fila);
    });
  });
  if (filasSabor.length && resumen && btn) pintarPedido();

  /* ---------- WhatsApp flotante: escondido donde ya hay un botón de pedir ---------- */
  var flotante = document.getElementById('waFlotante');
  var vigilados = [document.querySelector('.hero-accion'), document.getElementById('menu')].filter(Boolean);
  if (flotante && vigilados.length && 'IntersectionObserver' in window) {
    var visibles = new Set();
    var observadorFlotante = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target);
      });
      flotante.classList.toggle('oculto', visibles.size > 0);
    }, { threshold: 0.1 });
    vigilados.forEach(function (el) { observadorFlotante.observe(el); });
  } else if (flotante) {
    flotante.classList.remove('oculto');
  }
})();
