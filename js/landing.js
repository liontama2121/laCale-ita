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

  if ('IntersectionObserver' in window) {
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
        e.target.style.setProperty('--retraso', (i * 0.12) + 's');
        e.target.classList.add('dorada');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    filasSabor.forEach(function (el) { observadorDorar.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add('visible'); });
    filasSabor.forEach(function (el) { el.classList.add('dorada'); });
  }

  /* ---------- Canasta: sueltas + combos ---------- */
  var COMBOS = { 4: 11000, 6: 17000 };
  var SABORES = filasSabor.map(function (f) { return f.getAttribute('data-sabor'); });
  var canasta = document.getElementById('pedido');
  var resumen = document.getElementById('pedidoResumen');
  var canastaIcono = document.getElementById('canastaIcono');
  var canastaN = document.getElementById('canastaN');
  var finalLista = document.getElementById('finalLista');
  var finalVacio = document.getElementById('finalVacio');
  var finalTotal = document.getElementById('finalTotal');
  var pista = document.getElementById('pedidoPista');
  var cantidades = {};
  var combosEnCanasta = []; // [{ tipo: 4, sabores: { 'Queso': 2, ... } }]
  var finalEnPantalla = false;

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

  // Calcula todo lo que hay en la canasta
  function leerPedido() {
    var lineas = [];
    var sueltas = 0;
    var precio = 0;
    SABORES.forEach(function (sabor) {
      var n = cantidades[sabor] || 0;
      if (!n) return;
      sueltas += n;
      precio += n * PRECIO_UNIDAD;
      lineas.push({ tipo: 'suelta', sabor: sabor, n: n, precio: n * PRECIO_UNIDAD });
    });
    var enCombos = 0;
    combosEnCanasta.forEach(function (combo, i) {
      enCombos += combo.tipo;
      precio += COMBOS[combo.tipo];
      lineas.push({ tipo: 'combo', indice: i, combo: combo, precio: COMBOS[combo.tipo] });
    });
    return { lineas: lineas, sueltas: sueltas, total: sueltas + enCombos, precio: precio };
  }

  function botonQuitar(etiqueta, alQuitar) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'canasta-quitar';
    b.setAttribute('aria-label', etiqueta);
    b.appendChild(icono('icono-cerrar'));
    b.addEventListener('click', alQuitar);
    return b;
  }

  function pintarFinal(pedido, resaltarUltimo) {
    finalLista.textContent = '';
    pedido.lineas.forEach(function (l, i) {
      var li = document.createElement('li');
      li.className = 'final-linea' + (resaltarUltimo && i === pedido.lineas.length - 1 ? ' recien' : '');
      var texto = document.createElement('span');
      var fuerte = document.createElement('strong');
      var quitar;
      if (l.tipo === 'suelta') {
        fuerte.textContent = l.n + ' ';
        texto.appendChild(fuerte);
        texto.appendChild(document.createTextNode(l.sabor));
        quitar = botonQuitar('Quitar ' + l.sabor.toLowerCase() + ' del pedido', function () {
          cantidades[l.sabor] = 0;
          pintarPedido();
        });
      } else {
        fuerte.textContent = 'Combo x' + l.combo.tipo + ': ';
        texto.appendChild(fuerte);
        texto.appendChild(document.createTextNode(textoSabores(l.combo.sabores)));
        quitar = botonQuitar('Quitar combo x' + l.combo.tipo + ' del pedido', function () {
          combosEnCanasta.splice(l.indice, 1);
          pintarPedido();
        });
      }
      var precio = document.createElement('span');
      precio.className = 'precio';
      precio.textContent = formatoCOP(l.precio);
      li.appendChild(texto);
      li.appendChild(precio);
      li.appendChild(quitar);
      finalLista.appendChild(li);
    });

    finalVacio.hidden = pedido.total > 0;
    finalTotal.hidden = pedido.total === 0;
    if (pedido.total) {
      finalTotal.textContent = '';
      var etiqueta = document.createElement('span');
      etiqueta.textContent = 'Total, ' + plural(pedido.total, 'empanada', 'empanadas');
      var valor = document.createElement('strong');
      valor.textContent = formatoCOP(pedido.precio);
      finalTotal.appendChild(etiqueta);
      finalTotal.appendChild(valor);
    }
    if (pedido.sueltas >= 4) {
      pista.hidden = false;
      pista.innerHTML = 'Con 4 o más sueltas te sale mejor un combo. <a href="#combos">Ármalo aquí</a>.';
    } else {
      pista.hidden = true;
    }
  }

  function pintarPedido(resaltarUltimo) {
    var pedido = leerPedido();
    filasSabor.forEach(function (fila) {
      var n = cantidades[fila.getAttribute('data-sabor')] || 0;
      fila.querySelector('.sabor-cant').textContent = n;
      fila.querySelector('[data-accion="menos"]').disabled = n === 0;
      fila.querySelector('[data-accion="mas"]').disabled = n >= MAX_POR_SABOR;
      fila.classList.toggle('escogido', n > 0);
    });

    canastaN.textContent = pedido.total;
    resumen.textContent = '';
    if (pedido.total) {
      var fuerte = document.createElement('strong');
      fuerte.textContent = plural(pedido.total, 'empanada', 'empanadas');
      resumen.appendChild(fuerte);
      resumen.appendChild(document.createTextNode(' ' + formatoCOP(pedido.precio)));
    }
    canasta.hidden = pedido.total === 0;
    canasta.classList.toggle('escondida', finalEnPantalla);
    document.body.classList.toggle('con-canasta', pedido.total > 0);

    pintarFinal(pedido, resaltarUltimo);
    revisarEnvio();
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
      // La barra acaba de aparecer: esperar un cuadro para medir hacia dónde volar
      if (suma) requestAnimationFrame(function () {
        volar(fila.querySelector('.sabor-dibujo'), canastaIcono, saltarCanasta);
      });
      else saltarCanasta();
    });
  });

  /* ---------- Tu pedido: datos de entrega y envío por WhatsApp ---------- */
  var form = document.getElementById('formPedido');
  var btnEnviar = document.getElementById('btnEnviar');
  var btnEnviarTexto = document.getElementById('btnEnviarTexto');
  var finalAyuda = document.getElementById('finalAyuda');
  var CAMPOS = ['nombre', 'conjunto', 'torre', 'apto', 'notas'];
  var OBLIGATORIOS = { nombre: 'cNombre', conjunto: 'cConjunto', apto: 'cApto' };
  var CLAVE_CLIENTE = 'calenita_landing_cliente';

  function valor(nombre) { return form.elements[nombre].value.trim(); }

  function revisarEnvio() {
    if (!form) return;
    var pedido = leerPedido();
    btnEnviar.disabled = pedido.total === 0;
    btnEnviarTexto.textContent = pedido.total
      ? 'Enviar pedido por WhatsApp'
      : 'Primero escoge tus empanadas';
  }

  function validar() {
    var primero = null;
    Object.keys(OBLIGATORIOS).forEach(function (nombre) {
      var input = document.getElementById(OBLIGATORIOS[nombre]);
      var error = document.getElementById(OBLIGATORIOS[nombre] + 'Error');
      var falta = !valor(nombre);
      input.setAttribute('aria-invalid', String(falta));
      if (falta) input.setAttribute('aria-describedby', error.id);
      else input.removeAttribute('aria-describedby');
      error.hidden = !falta;
      if (falta && !primero) primero = input;
    });
    if (primero) primero.focus();
    return !primero;
  }

  function armarMensaje() {
    var pedido = leerPedido();
    var lineas = pedido.lineas.map(function (l) {
      return l.tipo === 'suelta'
        ? '- ' + l.n + ' ' + l.sabor
        : '- Combo x' + l.combo.tipo + ': ' + textoSabores(l.combo.sabores);
    });
    var direccion = 'Conjunto ' + valor('conjunto') +
      (valor('torre') ? ', torre ' + valor('torre') : '') +
      ', apto ' + valor('apto');
    var texto = 'Hola Caleñita, quiero hacer este pedido:\n' + lineas.join('\n') +
      '\nTotal: ' + plural(pedido.total, 'empanada', 'empanadas') + ', ' + formatoCOP(pedido.precio) +
      '\n\nNombre: ' + valor('nombre') +
      '\nDirección: ' + direccion;
    if (valor('notas')) texto += '\nNotas: ' + valor('notas');
    return texto;
  }

  if (form) {
    // Recordar los datos de quien ya pidió (solo en este navegador)
    try {
      var guardado = JSON.parse(localStorage.getItem(CLAVE_CLIENTE) || '{}');
      CAMPOS.forEach(function (c) {
        if (c !== 'notas' && guardado[c]) form.elements[c].value = guardado[c];
      });
    } catch (e) { /* sin almacenamiento: no pasa nada */ }

    form.addEventListener('input', function (e) {
      var id = e.target.id;
      var error = document.getElementById(id + 'Error');
      if (error && e.target.value.trim()) {
        error.hidden = true;
        e.target.setAttribute('aria-invalid', 'false');
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (leerPedido().total === 0) return;
      if (!validar()) {
        finalAyuda.textContent = 'Falta tu dirección para poder enviar el pedido.';
        return;
      }
      try {
        var datos = {};
        CAMPOS.forEach(function (c) { if (c !== 'notas') datos[c] = valor(c); });
        localStorage.setItem(CLAVE_CLIENTE, JSON.stringify(datos));
      } catch (err) { /* sin almacenamiento */ }
      finalAyuda.textContent = 'Abriendo WhatsApp con tu pedido. Solo le das enviar.';
      var url = 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(armarMensaje());
      var ventana = window.open(url, '_blank');
      if (ventana) ventana.opener = null;
      else window.location.href = url;
    });
  }

  if (filasSabor.length && resumen) pintarPedido();

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
      // El combo vuela desde su tarjeta hasta la canasta
      var tarjeta = document.querySelector('[data-combo="' + combosEnCanasta[combosEnCanasta.length - 1].tipo + '"] .abanico');
      requestAnimationFrame(function () { volar(tarjeta, canastaIcono, saltarCanasta); });
    });
  }

  /* ---------- La barra de canasta se esconde mientras se ve "Tu pedido" ---------- */
  var seccionFinal = document.getElementById('finalizar');
  if (seccionFinal && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      finalEnPantalla = entradas[0].isIntersecting;
      canasta.classList.toggle('escondida', finalEnPantalla);
    }, { rootMargin: '0px 0px -45% 0px' }).observe(seccionFinal);
  }
})();
