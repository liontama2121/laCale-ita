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

  /* ---------- Canasta: sueltas + combos, y el mensaje para WhatsApp ---------- */
  var COMBOS = { 4: 11000, 6: 17000 };
  var SABORES = filasSabor.map(function (f) { return f.getAttribute('data-sabor'); });
  var resumen = document.getElementById('pedidoResumen');
  var pista = document.getElementById('pedidoPista');
  var btn = document.getElementById('pedidoBtn');
  var btnTexto = document.getElementById('pedidoBtnTexto');
  var canastaIcono = document.getElementById('canastaIcono');
  var canastaN = document.getElementById('canastaN');
  var listaCombos = document.getElementById('canastaCombos');
  var cantidades = {};
  var combosEnCanasta = []; // [{ tipo: 4, sabores: { 'Queso': 2, ... } }]

  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  function textoSabores(sabores) {
    return SABORES.filter(function (s) { return sabores[s]; })
      .map(function (s) { return sabores[s] + ' ' + s; }).join(', ');
  }

  function icono(id) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function pintarCombosCanasta(resaltarUltimo) {
    listaCombos.textContent = '';
    combosEnCanasta.forEach(function (combo, i) {
      var li = document.createElement('li');
      li.className = 'canasta-combo' + (resaltarUltimo && i === combosEnCanasta.length - 1 ? ' recien' : '');
      var fuerte = document.createElement('strong');
      fuerte.textContent = 'Combo x' + combo.tipo + ':';
      var texto = document.createElement('span');
      texto.textContent = textoSabores(combo.sabores);
      var quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'canasta-quitar';
      quitar.setAttribute('aria-label', 'Quitar combo x' + combo.tipo + ' de la canasta');
      quitar.appendChild(icono('icono-cerrar'));
      quitar.addEventListener('click', function () {
        combosEnCanasta.splice(i, 1);
        pintarPedido();
        saltarCanasta();
      });
      var linea = document.createElement('span');
      linea.appendChild(fuerte);
      linea.appendChild(document.createTextNode(' '));
      linea.appendChild(texto);
      li.appendChild(linea);
      li.appendChild(quitar);
      listaCombos.appendChild(li);
    });
  }

  function pintarPedido(resaltarUltimo) {
    var sueltas = 0;
    var lineasMsg = [];
    filasSabor.forEach(function (fila) {
      var sabor = fila.getAttribute('data-sabor');
      var n = cantidades[sabor] || 0;
      sueltas += n;
      fila.querySelector('.sabor-cant').textContent = n;
      fila.querySelector('[data-accion="menos"]').disabled = n === 0;
      fila.querySelector('[data-accion="mas"]').disabled = n >= MAX_POR_SABOR;
      fila.classList.toggle('escogido', n > 0);
      if (n > 0) lineasMsg.push('- ' + n + ' ' + sabor);
    });

    var enCombos = 0;
    var precio = sueltas * PRECIO_UNIDAD;
    combosEnCanasta.forEach(function (combo) {
      enCombos += combo.tipo;
      precio += COMBOS[combo.tipo];
      lineasMsg.push('- Combo x' + combo.tipo + ': ' + textoSabores(combo.sabores));
    });
    var total = sueltas + enCombos;
    canastaN.textContent = total;
    pintarCombosCanasta(resaltarUltimo);

    var mensaje;
    if (total === 0) {
      resumen.textContent = 'Tu canasta está vacía. Mezcla los sabores como quieras.';
      pista.hidden = true;
      btnTexto.textContent = 'Pedir por WhatsApp';
      mensaje = 'Hola Caleñita, quiero pedir empanadas';
    } else {
      var partes = [];
      if (sueltas) partes.push(plural(sueltas, 'suelta', 'sueltas'));
      if (combosEnCanasta.length) partes.push(plural(combosEnCanasta.length, 'combo', 'combos'));
      resumen.textContent = '';
      var fuerte = document.createElement('strong');
      fuerte.textContent = plural(total, 'empanada', 'empanadas');
      resumen.appendChild(fuerte);
      resumen.appendChild(document.createTextNode(' (' + partes.join(' y ') + '): ' + formatoCOP(precio)));
      if (sueltas >= 4) {
        pista.hidden = false;
        pista.innerHTML = 'Con <strong>4 o más sueltas</strong> te sale mejor un combo. Ármalo en <a href="#combos">Combos</a>.';
      } else {
        pista.hidden = true;
      }
      btnTexto.textContent = 'Pedir ' + total + ' por WhatsApp';
      mensaje = 'Hola Caleñita, quiero pedir:\n' + lineasMsg.join('\n') +
        '\nTotal: ' + plural(total, 'empanada', 'empanadas') + ', ' + formatoCOP(precio);
    }
    btn.href = 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(mensaje);
  }

  function saltarCanasta() {
    canastaIcono.classList.remove('salto');
    void canastaIcono.offsetWidth; // reinicia la animación
    canastaIcono.classList.add('salto');
  }

  // Una empanada vuela en arco desde un elemento hasta otro
  function volar(desdeEl, haciaEl, alTerminar) {
    var origen = desdeEl.getBoundingClientRect();
    var destino = haciaEl.getBoundingClientRect();
    if (sinMovimiento || !origen.width || !destino.width || !document.body.animate) {
      if (alTerminar) alTerminar();
      return;
    }
    var ancho = Math.min(origen.width, 90);
    var voladora = document.createElement('div');
    voladora.className = 'voladora';
    voladora.style.left = (origen.left + origen.width / 2 - ancho / 2) + 'px';
    voladora.style.top = origen.top + 'px';
    voladora.style.width = ancho + 'px';
    voladora.appendChild(nuevaEmpanada());
    document.body.appendChild(voladora);

    var dx = destino.left + destino.width / 2 - (origen.left + origen.width / 2);
    var dy = destino.top + destino.height / 2 - (origen.top + ancho * 0.3);
    var alto = Math.min(-60, dy * 0.25 - 80);
    var vuelo = voladora.animate([
      { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
      { transform: 'translate(' + dx * 0.5 + 'px, ' + (dy * 0.5 + alto) + 'px) rotate(-200deg) scale(0.9)', offset: 0.5 },
      { transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(-380deg) scale(0.35)' }
    ], { duration: 650, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
    vuelo.onfinish = function () {
      voladora.remove();
      if (alTerminar) alTerminar();
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
      if (suma) volar(fila.querySelector('.sabor-dibujo'), canastaIcono, saltarCanasta);
      else saltarCanasta();
    });
  });
  if (filasSabor.length && resumen && btn) pintarPedido();

  /* ---------- Armador de combos: escoger exactamente 4 o 6 sabores ---------- */
  var armador = document.getElementById('armador');
  var armadorTitulo = document.getElementById('armadorTitulo');
  var armadorCuenta = document.getElementById('armadorCuenta');
  var armadorPuestos = document.getElementById('armadorPuestos');
  var armadorSabores = document.getElementById('armadorSabores');
  var armadorAgregar = document.getElementById('armadorAgregar');
  var botonesCombo = Array.prototype.slice.call(document.querySelectorAll('[data-combo]'));
  var armado = { tipo: 0, orden: [] }; // orden: sabores en el orden en que se escogieron

  function contar(sabor) {
    return armado.orden.filter(function (s) { return s === sabor; }).length;
  }

  function pintarArmador(nuevoIndice) {
    var llenas = armado.orden.length;
    var completo = llenas === armado.tipo;
    armadorTitulo.textContent = 'Arma tu combo x' + armado.tipo;
    armadorCuenta.textContent = llenas + ' de ' + armado.tipo;
    armadorCuenta.classList.toggle('completo', completo);
    armadorAgregar.disabled = !completo;
    armadorAgregar.textContent = completo
      ? 'Agregar combo x' + armado.tipo + ' a la canasta'
      : (armado.tipo - llenas === 1 ? 'Falta 1 sabor' : 'Faltan ' + (armado.tipo - llenas) + ' sabores');

    // Puestos: uno por empanada del combo
    armadorPuestos.style.setProperty('--puestos', armado.tipo);
    armadorPuestos.classList.toggle('completo', completo && nuevoIndice === llenas - 1);
    armadorPuestos.textContent = '';
    for (var i = 0; i < armado.tipo; i++) {
      var puesto = document.createElement('div');
      puesto.className = 'puesto';
      var hueco = document.createElement('div');
      hueco.className = 'puesto-hueco';
      var nombre = document.createElement('span');
      nombre.className = 'puesto-nombre';
      if (i < llenas) {
        puesto.classList.add('lleno');
        if (i === nuevoIndice) puesto.classList.add('nuevo');
        hueco.appendChild(nuevaEmpanada());
        nombre.textContent = armado.orden[i];
      }
      puesto.appendChild(hueco);
      puesto.appendChild(nombre);
      armadorPuestos.appendChild(puesto);
    }

    // Sabores con su cuenta
    armadorSabores.querySelectorAll('.armador-sabor').forEach(function (li) {
      var n = contar(li.getAttribute('data-sabor'));
      li.querySelector('.sabor-cant').textContent = n;
      li.querySelector('[data-accion="menos"]').disabled = n === 0;
      li.querySelector('[data-accion="mas"]').disabled = completo;
      li.classList.toggle('escogido', n > 0);
    });
  }

  function botonSabor(accion, sabor, etiqueta) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sabor-btn' + (accion === 'mas' ? ' sabor-btn-mas' : '');
    b.setAttribute('data-accion', accion);
    b.setAttribute('aria-label', etiqueta + ' ' + sabor.toLowerCase() + ' al combo');
    b.appendChild(icono(accion === 'mas' ? 'icono-mas' : 'icono-menos'));
    return b;
  }

  function abrirArmador(tipo) {
    if (armado.tipo !== tipo) armado = { tipo: tipo, orden: [] };
    botonesCombo.forEach(function (b) {
      b.setAttribute('aria-expanded', String(Number(b.getAttribute('data-combo')) === tipo));
    });
    armador.hidden = false;
    armador.classList.remove('abriendo');
    void armador.offsetWidth;
    armador.classList.add('abriendo');
    pintarArmador(-1);
    armador.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'nearest' });
  }

  function cerrarArmador() {
    armador.hidden = true;
    botonesCombo.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }

  if (armador) {
    SABORES.forEach(function (sabor) {
      var li = document.createElement('li');
      li.className = 'armador-sabor';
      li.setAttribute('data-sabor', sabor);
      var nombre = document.createElement('span');
      nombre.className = 'armador-sabor-nombre';
      nombre.textContent = sabor;
      var control = document.createElement('span');
      control.className = 'sabor-control';
      var cant = document.createElement('output');
      cant.className = 'sabor-cant';
      cant.textContent = '0';
      control.appendChild(botonSabor('menos', sabor, 'Quitar'));
      control.appendChild(cant);
      control.appendChild(botonSabor('mas', sabor, 'Agregar'));
      li.appendChild(nombre);
      li.appendChild(control);
      armadorSabores.appendChild(li);

      li.addEventListener('click', function (e) {
        var boton = e.target.closest('.sabor-btn');
        if (!boton || boton.disabled) return;
        if (boton.getAttribute('data-accion') === 'mas') {
          if (armado.orden.length >= armado.tipo) return;
          armado.orden.push(sabor);
          pintarArmador(armado.orden.length - 1);
        } else {
          armado.orden.splice(armado.orden.lastIndexOf(sabor), 1);
          pintarArmador(-1);
        }
      });
    });

    botonesCombo.forEach(function (b) {
      b.addEventListener('click', function () {
        var tipo = Number(b.getAttribute('data-combo'));
        if (!armador.hidden && armado.tipo === tipo) cerrarArmador();
        else abrirArmador(tipo);
      });
    });
    document.getElementById('armadorCerrar').addEventListener('click', function () {
      cerrarArmador();
      botonesCombo[0].focus();
    });

    armadorAgregar.addEventListener('click', function () {
      if (armado.orden.length !== armado.tipo) return;
      var sabores = {};
      armado.orden.forEach(function (s) { sabores[s] = (sabores[s] || 0) + 1; });
      combosEnCanasta.push({ tipo: armado.tipo, sabores: sabores });
      armado = { tipo: armado.tipo, orden: [] };
      cerrarArmador();
      pintarPedido(true);
      // Llevar a la persona a su canasta, donde ya aparece el combo
      document.getElementById('pedido').scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'center' });
      setTimeout(saltarCanasta, sinMovimiento ? 0 : 600);
    });
  }

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
