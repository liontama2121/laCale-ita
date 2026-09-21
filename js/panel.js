/* ==========================================================
   panel.js — lógica del panel: tabs, pedidos, finanzas, rifa, backup
   Depende de: ui.js (UI), auth.js (Auth), data.js (Datos)
   ========================================================== */
(function () {
  'use strict';

  if (!Auth.requerirSesion()) return;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var fmt = UI.formatoCOP;
  var esc = UI.escapar;
  var toast = UI.mostrarToast;

  var DIAS_BACKUP = 7;

  // Estado de UI (no persistente)
  var estado = {
    tab: 'nuevo',
    filtroPedidos: 'todos',
    fechaPedidos: '',
    rangoFinanzas: 'todo',
    cantidades: {},      // sueltas por sabor
    combos: [],          // [{ tipo: 4|6, sabores: {...} }]
    ultimoGanador: null,
    sorteando: false
  };

  // ==========================================================
  // TOPBAR
  // ==========================================================
  $('#nombreUsuario').textContent = Auth.nombreUsuario();
  $('#btnSalir').addEventListener('click', function () {
    UI.confirmar({ titulo: '¿Cerrar sesión?', mensaje: 'Tus datos quedan guardados en este navegador.', textoAceptar: 'Cerrar sesión' })
      .then(function (ok) { if (ok) Auth.cerrarSesion(); });
  });

  // ==========================================================
  // TABS
  // ==========================================================
  function irATab(nombre) {
    estado.tab = nombre;
    $$('.tab').forEach(function (b) {
      var activa = b.dataset.tab === nombre;
      b.classList.toggle('activa', activa);
      b.setAttribute('aria-selected', activa ? 'true' : 'false');
      if (activa) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
    $$('.tab-panel').forEach(function (p) {
      var activa = p.id === 'tab-' + nombre;
      p.hidden = !activa;
      p.classList.toggle('activa', activa);
    });
    // Refrescar contenido de la tab al entrar
    if (nombre === 'pedidos') renderPedidos();
    if (nombre === 'finanzas') renderFinanzas();
    if (nombre === 'rifa') renderRifa();
    if (nombre === 'backup') renderBackup();
    try { sessionStorage.setItem('calenita_tab', nombre); } catch (e) { /* ignorar */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.tab').forEach(function (b) {
    b.addEventListener('click', function () { irATab(b.dataset.tab); });
  });
  $$('[data-ir-tab]').forEach(function (b) {
    b.addEventListener('click', function () { irATab(b.dataset.irTab); });
  });

  function actualizarBadgePedidos() {
    var pendientes = Datos.pedidos().filter(function (p) { return !p.pagado; }).length;
    var badge = $('#badgePedidos');
    badge.textContent = pendientes;
    badge.hidden = pendientes === 0;
  }

  // ==========================================================
  // BANNER BACKUP
  // ==========================================================
  function actualizarBanner() {
    var dias = Datos.diasDesdeBackup();
    var banner = $('#bannerBackup');
    var texto = $('#bannerBackupTexto');
    var hayDatos = Datos.pedidos().length > 0 || Datos.gastos().length > 0;
    if (!hayDatos) { banner.hidden = true; return; }
    if (dias === null) {
      texto.textContent = '⚠️ Recuerda respaldar tus datos: nunca has exportado';
      banner.hidden = false;
    } else if (dias >= DIAS_BACKUP) {
      texto.textContent = '⚠️ Recuerda respaldar tus datos: no has exportado en ' + dias + ' día' + (dias === 1 ? '' : 's');
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }

  // ==========================================================
  // TAB 1 — NUEVO PEDIDO
  // ==========================================================
  var formPedido = $('#formPedido');
  var saboresLista = $('#saboresLista');
  var combosLista = $('#combosLista');

  function filaSaborHTML(s, n) {
    return '<span class="sabor-nombre"><span class="emoji" aria-hidden="true">' + s.emoji + '</span>' + esc(s.nombre) + '</span>' +
      '<div class="contador" role="group" aria-label="Cantidad de ' + esc(s.nombre) + '">' +
        '<button type="button" data-accion="menos" aria-label="Quitar una ' + esc(s.nombre) + '"' + (n === 0 ? ' disabled' : '') + '>−</button>' +
        '<span class="cantidad" aria-live="polite">' + n + '</span>' +
        '<button type="button" data-accion="mas" aria-label="Agregar una ' + esc(s.nombre) + '">+</button>' +
      '</div>';
  }

  // ---- Sueltas ----
  function construirSabores() {
    saboresLista.innerHTML = '';
    Datos.SABORES.forEach(function (s) {
      estado.cantidades[s.id] = 0;
      var fila = document.createElement('div');
      fila.className = 'sabor-fila';
      fila.dataset.sabor = s.id;
      fila.innerHTML = filaSaborHTML(s, 0);
      saboresLista.appendChild(fila);
    });
  }

  saboresLista.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    var fila = btn.closest('.sabor-fila');
    var id = fila.dataset.sabor;
    var delta = btn.dataset.accion === 'mas' ? 1 : -1;
    estado.cantidades[id] = Math.max(0, Math.min(99, (estado.cantidades[id] || 0) + delta));
    actualizarFilaSabor(fila, estado.cantidades[id]);
    actualizarTotalPedido();
  });

  function actualizarFilaSabor(fila, n) {
    $('.cantidad', fila).textContent = n;
    $('[data-accion="menos"]', fila).disabled = n === 0;
    fila.classList.toggle('con-cantidad', n > 0);
  }

  // ---- Combos explícitos ----
  function agregarCombo(tipo) {
    estado.combos.push({ tipo: tipo, sabores: Datos.saboresVacios() });
    renderCombos();
    actualizarTotalPedido();
    var ultimo = combosLista.lastElementChild;
    if (ultimo) ultimo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderCombos() {
    combosLista.innerHTML = estado.combos.map(function (c, idx) {
      var n = Datos.totalDeSabores(c.sabores);
      var completo = n === c.tipo;
      return '<div class="combo-bloque' + (completo ? ' completo' : '') + '" data-idx="' + idx + '">' +
        '<div class="combo-cabecera">' +
          '<span class="combo-titulo">🎉 Combo x' + c.tipo + ' <span class="combo-precio-chico">' + fmt(Datos.COMBOS[c.tipo]) + '</span></span>' +
          '<span class="combo-progreso' + (completo ? ' ok' : '') + '">' + n + '/' + c.tipo + (completo ? ' ✅' : '') + '</span>' +
          '<button type="button" class="btn-icono" data-accion="quitar-combo" aria-label="Quitar combo">🗑️</button>' +
        '</div>' +
        '<div class="sabores-lista">' +
          Datos.SABORES.map(function (s) {
            return '<div class="sabor-fila' + (c.sabores[s.id] > 0 ? ' con-cantidad' : '') + '" data-sabor="' + s.id + '">' + filaSaborHTML(s, c.sabores[s.id]) + '</div>';
          }).join('') +
        '</div>' +
        (completo ? '' : '<p class="combo-aviso">Elige ' + (c.tipo - n) + ' más para completar el combo</p>') +
      '</div>';
    }).join('');
  }

  combosLista.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    var bloque = btn.closest('.combo-bloque');
    var idx = Number(bloque.dataset.idx);
    var combo = estado.combos[idx];
    if (!combo) return;
    if (btn.dataset.accion === 'quitar-combo') {
      estado.combos.splice(idx, 1);
      renderCombos();
      actualizarTotalPedido();
      return;
    }
    var id = btn.closest('.sabor-fila').dataset.sabor;
    var n = Datos.totalDeSabores(combo.sabores);
    if (btn.dataset.accion === 'mas') {
      if (n >= combo.tipo) { toast('El combo x' + combo.tipo + ' ya está completo', 'info', 1500); return; }
      combo.sabores[id]++;
    } else {
      combo.sabores[id] = Math.max(0, combo.sabores[id] - 1);
    }
    renderCombos();
    actualizarTotalPedido();
  });

  $$('[data-agregar-combo]').forEach(function (b) {
    b.addEventListener('click', function () { agregarCombo(Number(b.dataset.agregarCombo)); });
  });

  // ---- Total ----
  function actualizarTotalPedido() {
    var cot = Datos.cotizar(estado.cantidades, estado.combos);
    $('#pCantidad').textContent = cot.totalEmpanadas;
    $('#pTotal').textContent = fmt(cot.precio);
    $('#pDesglose').textContent = cot.totalEmpanadas ? Datos.textoDesglose(cot.desglose) : 'Agrega empanadas para ver el precio';
    var badge = $('#pAhorro');
    badge.hidden = !(cot.ahorro > 0);
    if (cot.ahorro > 0) badge.textContent = '🎉 Ahorra ' + fmt(cot.ahorro) + ' con combo';
    $('#btnRegistrar').disabled = cot.errores.length > 0;
  }

  function limpiarFormPedido() {
    formPedido.reset();
    Datos.SABORES.forEach(function (s) {
      estado.cantidades[s.id] = 0;
      actualizarFilaSabor($('.sabor-fila[data-sabor="' + s.id + '"]', saboresLista), 0);
    });
    estado.combos = [];
    renderCombos();
    actualizarTotalPedido();
    $('#pCliente').classList.remove('invalido');
    $('#pClienteAyuda').hidden = true;
    renderListaClientes();
  }

  formPedido.addEventListener('submit', function (e) {
    e.preventDefault();
    var cliente = $('#pCliente').value.trim();
    if (!cliente) {
      $('#pCliente').classList.add('invalido');
      $('#pCliente').focus();
      toast('Escribe el nombre del cliente', 'error');
      return;
    }
    var cot = Datos.cotizar(estado.cantidades, estado.combos);
    if (cot.errores.length) {
      toast(cot.errores[0], 'error');
      combosLista.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (cot.totalEmpanadas === 0) {
      toast('Agrega al menos una empanada', 'error');
      saboresLista.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    var pedido = Datos.agregarPedido({
      cliente: cliente,
      conjunto: $('#pConjunto').value,
      torre: $('#pTorre').value,
      apartamento: $('#pApto').value,
      sueltas: estado.cantidades,
      combos: estado.combos,
      pagado: $('#pPagado').checked,
      notas: $('#pNotas').value
    });
    mostrarModalPedido(pedido);
    limpiarFormPedido();
    actualizarBadgePedidos();
    actualizarBanner();
  });

  // ---- Clientes existentes: sugerencias + autollenado para no repetir clientes ----
  function renderListaClientes() {
    $('#listaClientes').innerHTML = Datos.clientes().map(function (c) {
      return '<option value="' + esc(c.nombre) + '"></option>';
    }).join('');
  }

  function revisarClienteExistente() {
    var input = $('#pCliente');
    var ayuda = $('#pClienteAyuda');
    var c = Datos.buscarCliente(input.value);
    if (!c) { ayuda.hidden = true; ayuda.textContent = ''; return; }
    // Rellena solo los campos vacíos, nunca pisa lo que Lina ya escribió
    if (!$('#pConjunto').value.trim() && c.conjunto) $('#pConjunto').value = c.conjunto;
    if (!$('#pTorre').value.trim() && c.torre) $('#pTorre').value = c.torre;
    if (!$('#pApto').value.trim() && c.apartamento) $('#pApto').value = c.apartamento;
    ayuda.textContent = '✅ Cliente ya registrado · ' + c.pedidos + (c.pedidos === 1 ? ' pedido' : ' pedidos');
    ayuda.hidden = false;
  }

  $('#pCliente').addEventListener('input', function () {
    this.classList.remove('invalido');
    revisarClienteExistente();
  });
  $('#pCliente').addEventListener('change', revisarClienteExistente);

  // Modal de confirmación de pedido
  var modalPedido = $('#modalPedido');
  function mostrarModalPedido(p) {
    $('#mpCliente').textContent = p.cliente;
    $('#mpTotal').textContent = fmt(p.total);
    $('#mpRifa').textContent = p.numeroRifa || '—';
    modalPedido.hidden = false;
    $('#mpNuevo').focus();
  }
  function cerrarModalPedido() { modalPedido.hidden = true; }
  $('#mpCerrar').addEventListener('click', function () { cerrarModalPedido(); irATab('pedidos'); });
  $('#mpNuevo').addEventListener('click', function () { cerrarModalPedido(); $('#pCliente').focus(); });
  modalPedido.addEventListener('click', function (e) { if (e.target === modalPedido) cerrarModalPedido(); });

  // ==========================================================
  // TAB 2 — PEDIDOS
  // ==========================================================
  var pedidosLista = $('#pedidosLista');

  function resumenSabores(sabores) {
    var partes = [];
    Datos.SABORES.forEach(function (s) {
      var n = Number(sabores[s.id]) || 0;
      if (n > 0) partes.push(n + ' ' + s.nombre.replace('Papa ', ''));
    });
    return partes.join(', ') || 'Sin productos';
  }

  // Líneas de productos: una por combo + una de sueltas (pedidos viejos: solo totales)
  function lineasProductos(p) {
    var lineas = [];
    if (Array.isArray(p.combos) && p.combos.length) {
      p.combos.forEach(function (c) {
        lineas.push('<span class="pedido-productos"><span class="tag-combo">Combo x' + c.tipo + '</span> ' + esc(resumenSabores(c.sabores || {})) + '</span>');
      });
      var ns = Datos.totalDeSabores(p.sueltas || {});
      if (ns > 0) lineas.push('<span class="pedido-productos">🥟 ' + esc(resumenSabores(p.sueltas)) + ' <span class="pedido-sueltas">(sueltas)</span></span>');
    } else {
      lineas.push('<span class="pedido-productos">🥟 ' + esc(resumenSabores(p.sabores || {})) +
        (etiquetaCombo(p) ? ' <span class="tag-combo">· ' + esc(etiquetaCombo(p)) + '</span>' : '') + '</span>');
    }
    return lineas.join('');
  }

  function ubicacion(p) {
    var partes = [];
    if (p.conjunto) partes.push(p.conjunto);
    var tor = [];
    if (p.torre) tor.push('Torre ' + p.torre);
    if (p.apartamento) tor.push('Apto ' + p.apartamento);
    if (tor.length) partes.push(tor.join(' '));
    return partes.join(' — ');
  }

  function etiquetaCombo(p) {
    if (!p.desgloseCombo || !(p.ahorroCombo > 0)) return '';
    return Datos.textoCombos(p.desgloseCombo);
  }

  function fechaLocalISO(iso) {
    return UI.hoyISO(new Date(iso));
  }

  function renderPedidos() {
    var lista = Datos.pedidos();
    if (estado.filtroPedidos === 'pagados') lista = lista.filter(function (p) { return p.pagado; });
    if (estado.filtroPedidos === 'pendientes') lista = lista.filter(function (p) { return !p.pagado; });
    if (estado.fechaPedidos) lista = lista.filter(function (p) { return fechaLocalISO(p.fecha) === estado.fechaPedidos; });
    lista.sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });

    var total = lista.reduce(function (s, p) { return s + (Number(p.total) || 0); }, 0);
    $('#pedidosResumen').textContent = lista.length
      ? lista.length + ' pedido' + (lista.length === 1 ? '' : 's') + ' · ' + fmt(total)
      : '';

    if (!lista.length) {
      pedidosLista.innerHTML = '<div class="vacio"><span class="emoji">🥟</span>No hay pedidos ' +
        (estado.filtroPedidos === 'todos' && !estado.fechaPedidos ? 'todavía. ¡Registra el primero!' : 'con ese filtro.') + '</div>';
      return;
    }

    pedidosLista.innerHTML = lista.map(function (p) {
      var ub = ubicacion(p);
      return '<article class="pedido-card ' + (p.pagado ? 'pagado' : '') + '" data-id="' + p.id + '">' +
        '<div class="pedido-info">' +
          '<span class="pedido-fecha">' + UI.fechaCorta(p.fecha) + '</span>' +
          '<span class="pedido-cliente">' + esc(p.cliente) + '</span>' +
          (ub ? '<span class="pedido-ubicacion">📍 ' + esc(ub) + '</span>' : '') +
          lineasProductos(p) +
          (p.notas ? '<span class="pedido-notas">📝 ' + esc(p.notas) + '</span>' : '') +
        '</div>' +
        '<div class="pedido-lado">' +
          '<span class="pedido-total">' + fmt(p.total) + '</span>' +
          '<span class="badge ' + (p.pagado ? 'badge-verde">Pagado' : 'badge-rojo">Pendiente') + '</span>' +
          '<span class="pedido-rifa">🎟️ ' + esc(p.numeroRifa || '—') + '</span>' +
        '</div>' +
        '<div class="pedido-acciones">' +
          (p.pagado
            ? '<button type="button" class="btn btn-outline btn-chico" data-accion="pendiente">↩️ Marcar pendiente</button>'
            : '<button type="button" class="btn btn-verde btn-chico" data-accion="pagar">✅ Marcar pagado</button>') +
          '<button type="button" class="btn btn-outline btn-chico" data-accion="eliminar">🗑️ Eliminar</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  pedidosLista.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-accion]');
    if (!btn) return;
    var card = btn.closest('.pedido-card');
    var id = card.dataset.id;
    var accion = btn.dataset.accion;

    if (accion === 'pagar') {
      Datos.marcarPagado(id, true);
      toast('✅ Pedido marcado como pagado', 'exito');
      renderPedidos(); actualizarBadgePedidos();
    } else if (accion === 'pendiente') {
      Datos.marcarPagado(id, false);
      toast('Pedido marcado como pendiente', 'info');
      renderPedidos(); actualizarBadgePedidos();
    } else if (accion === 'eliminar') {
      var p = Datos.pedidos().find(function (x) { return x.id === id; });
      UI.confirmar({
        titulo: '¿Eliminar pedido?',
        mensaje: (p ? p.cliente + ' · ' + fmt(p.total) : '') + '. Esta acción no se puede deshacer.',
        textoAceptar: 'Sí, eliminar',
        peligro: true
      }).then(function (ok) {
        if (!ok) return;
        Datos.eliminarPedido(id);
        toast('Pedido eliminado', 'info');
        renderPedidos(); actualizarBadgePedidos(); actualizarBanner();
      });
    }
  });

  $$('[data-filtro]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      estado.filtroPedidos = chip.dataset.filtro;
      $$('[data-filtro]').forEach(function (c) { c.classList.toggle('activa', c === chip); });
      renderPedidos();
    });
  });

  var filtroFecha = $('#filtroFecha');
  var btnLimpiarFecha = $('#btnLimpiarFecha');
  filtroFecha.addEventListener('change', function () {
    estado.fechaPedidos = filtroFecha.value;
    btnLimpiarFecha.hidden = !filtroFecha.value;
    renderPedidos();
  });
  btnLimpiarFecha.addEventListener('click', function () {
    filtroFecha.value = '';
    estado.fechaPedidos = '';
    btnLimpiarFecha.hidden = true;
    renderPedidos();
  });

  // ==========================================================
  // TAB 3 — FINANZAS
  // ==========================================================
  var modalGasto = $('#modalGasto');
  var formGasto = $('#formGasto');

  function abrirModalGasto() {
    formGasto.reset();
    $('#gFecha').value = UI.hoyISO();
    modalGasto.hidden = false;
    $('#gDescripcion').focus();
  }
  function cerrarModalGasto() { modalGasto.hidden = true; }

  $('#btnNuevoGasto').addEventListener('click', abrirModalGasto);
  $('#gCancelar').addEventListener('click', cerrarModalGasto);
  modalGasto.addEventListener('click', function (e) { if (e.target === modalGasto) cerrarModalGasto(); });

  formGasto.addEventListener('submit', function (e) {
    e.preventDefault();
    var desc = $('#gDescripcion').value.trim();
    var monto = Number($('#gMonto').value);
    if (!desc) { toast('Escribe una descripción', 'error'); $('#gDescripcion').focus(); return; }
    if (!(monto > 0)) { toast('El monto debe ser mayor a 0', 'error'); $('#gMonto').focus(); return; }
    var tipo = (formGasto.querySelector('input[name="gTipo"]:checked') || {}).value || 'inversion';
    Datos.agregarGasto({ tipo: tipo, descripcion: desc, monto: monto, fecha: $('#gFecha').value || UI.hoyISO() });
    cerrarModalGasto();
    toast('Gasto registrado', 'exito');
    renderFinanzas();
    actualizarBanner();
  });

  function renderGastos() {
    var lista = Datos.gastos().sort(function (a, b) {
      return (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0) || b.id - a.id;
    });
    var cont = $('#gastosLista');
    if (!lista.length) {
      cont.innerHTML = '<div class="vacio"><span class="emoji">🧺</span>Sin gastos registrados</div>';
      return;
    }
    cont.innerHTML = lista.slice(0, 20).map(function (g) {
      var esInv = g.tipo !== 'otro';
      return '<div class="gasto-item" data-id="' + g.id + '">' +
        '<span class="gasto-icono" aria-hidden="true">' + (esInv ? '🧺' : '🧾') + '</span>' +
        '<div class="gasto-info">' +
          '<span class="gasto-desc">' + esc(g.descripcion) + '</span>' +
          '<span class="gasto-meta">' + (esInv ? 'Inversión' : 'Otro gasto') + ' · ' + UI.fechaLarga(g.fecha + 'T12:00:00') + '</span>' +
        '</div>' +
        '<span class="gasto-monto">' + fmt(g.monto) + '</span>' +
        '<button type="button" class="btn-icono" data-accion="eliminar-gasto" aria-label="Eliminar gasto">🗑️</button>' +
      '</div>';
    }).join('') + (lista.length > 20 ? '<p class="resumen-lista centrado">Mostrando los últimos 20 de ' + lista.length + '</p>' : '');
  }

  $('#gastosLista').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-accion="eliminar-gasto"]');
    if (!btn) return;
    var id = btn.closest('.gasto-item').dataset.id;
    var g = Datos.gastos().find(function (x) { return x.id === id; });
    UI.confirmar({
      titulo: '¿Eliminar gasto?',
      mensaje: g ? g.descripcion + ' · ' + fmt(g.monto) : '',
      textoAceptar: 'Sí, eliminar',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      Datos.eliminarGasto(id);
      toast('Gasto eliminado', 'info');
      renderFinanzas();
    });
  });

  function renderDashboard() {
    var r = Datos.resumen(estado.rangoFinanzas);
    $('#dCobrado').textContent = fmt(r.cobrado);
    $('#dPorCobrar').textContent = fmt(r.porCobrar);
    $('#dGastos').textContent = fmt(r.gastos);
    $('#dUtilidad').textContent = fmt(r.utilidad);
    var card = $('#cardUtilidad');
    card.classList.toggle('positiva', r.utilidad > 0);
    card.classList.toggle('negativa', r.utilidad < 0);
    $('#dEmpanadas').textContent = r.empanadas;
    $('#dPedidos').textContent = r.pedidos ? 'en ' + r.pedidos + ' pedido' + (r.pedidos === 1 ? '' : 's') : '';
  }

  function renderFinanzas() {
    renderGastos();
    renderDashboard();
  }

  $$('[data-rango]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      estado.rangoFinanzas = chip.dataset.rango;
      $$('[data-rango]').forEach(function (c) { c.classList.toggle('activa', c === chip); });
      renderDashboard();
    });
  });

  // ==========================================================
  // TAB 4 — RIFA
  // ==========================================================
  function participantes() {
    return Datos.pedidos()
      .filter(function (p) { return p.numeroRifa; })
      .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
  }

  function renderRifa() {
    var lista = participantes();
    $('#rifaContador').textContent = lista.length;
    $('#btnSortear').disabled = lista.length === 0 || estado.sorteando;
    var cont = $('#rifaLista');
    if (!lista.length) {
      cont.innerHTML = '<div class="vacio"><span class="emoji">🎟️</span>Aún no hay números asignados. Cada pedido nuevo recibe uno.</div>';
      return;
    }
    cont.innerHTML = lista.map(function (p) {
      var esGanador = estado.ultimoGanador && estado.ultimoGanador.id === p.id;
      return '<div class="rifa-item' + (esGanador ? ' ganador-item' : '') + '">' +
        '<span class="rifa-item-num">' + esc(p.numeroRifa) + '</span>' +
        '<span class="rifa-item-nombre">' + (esGanador ? '🏆 ' : '') + esc(p.cliente) + '</span>' +
        '<span class="rifa-item-fecha">' + UI.fechaCorta(p.fecha) + '</span>' +
      '</div>';
    }).join('');
  }

  function lanzarConfeti(cantidad) {
    var colores = ['#F4C542', '#D64545', '#7CB342', '#4FB3D9', '#F49A2C', '#FFFFFF', '#1E3A5F'];
    var ancho = window.innerWidth;
    for (var i = 0; i < (cantidad || 120); i++) {
      var pieza = document.createElement('span');
      pieza.className = 'confeti-pieza';
      pieza.style.left = Math.random() * ancho + 'px';
      pieza.style.background = colores[Math.floor(Math.random() * colores.length)];
      pieza.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      pieza.style.setProperty('--rot', (Math.random() * 1080 - 540) + 'deg');
      pieza.style.animationDuration = (2 + Math.random() * 2) + 's';
      pieza.style.animationDelay = (Math.random() * 0.8) + 's';
      pieza.style.width = (6 + Math.random() * 8) + 'px';
      pieza.style.height = (10 + Math.random() * 10) + 'px';
      document.body.appendChild(pieza);
      (function (el) { setTimeout(function () { el.remove(); }, 5000); })(pieza);
    }
  }

  $('#btnSortear').addEventListener('click', function () {
    var lista = participantes();
    if (!lista.length || estado.sorteando) return;
    estado.sorteando = true;
    var display = $('#rifaDisplay');
    var numEl = $('#rifaNumero');
    var nomEl = $('#rifaNombre');
    var totEl = $('#rifaTotal');
    var btn = $('#btnSortear');
    btn.disabled = true;
    $('#btnReiniciarRifa').disabled = true;
    display.classList.remove('ganador');
    display.classList.add('girando');
    nomEl.textContent = '🎰 Sorteando...';
    totEl.textContent = '';

    var ganador = lista[Math.floor(Math.random() * lista.length)];
    var inicio = Date.now();
    var duracion = 3000;
    var intervalo = 60;

    var timer = setInterval(function () {
      var t = Date.now() - inicio;
      // Desacelera: aumenta el intervalo efectivo saltando ticks
      numEl.textContent = String(Math.floor(1000 + Math.random() * 9000));
      if (t >= duracion) {
        clearInterval(timer);
        display.classList.remove('girando');
        display.classList.add('ganador');
        numEl.textContent = ganador.numeroRifa;
        nomEl.textContent = '🏆 ' + ganador.cliente;
        totEl.textContent = 'Pedido de ' + fmt(ganador.total) + ' · ' + UI.fechaCorta(ganador.fecha);
        estado.ultimoGanador = ganador;
        estado.sorteando = false;
        btn.disabled = false;
        $('#btnReiniciarRifa').disabled = false;
        btn.textContent = '🎰 SORTEAR DE NUEVO';
        lanzarConfeti(140);
        renderRifa();
      }
    }, intervalo);
  });

  $('#btnReiniciarRifa').addEventListener('click', function () {
    UI.confirmar({
      titulo: '¿Reiniciar la rifa?',
      mensaje: 'Se borran todos los números de rifa. Los pedidos y las finanzas NO se tocan. Los pedidos nuevos volverán a recibir número.',
      textoAceptar: 'Sí, reiniciar',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      Datos.reiniciarRifa();
      estado.ultimoGanador = null;
      $('#rifaDisplay').classList.remove('ganador');
      $('#rifaNumero').textContent = '????';
      $('#rifaNombre').textContent = 'Presiona el botón para sortear';
      $('#rifaTotal').textContent = '';
      $('#btnSortear').textContent = '🎰 SORTEAR GANADOR';
      toast('Rifa reiniciada', 'info');
      renderRifa();
      renderPedidos();
    });
  });

  // ==========================================================
  // TAB 5 — BACKUP
  // ==========================================================
  function renderBackup() {
    var dias = Datos.diasDesdeBackup();
    var el = $('#backupEstado');
    var ub = Datos.cargar().config.ultimoBackup;
    el.classList.remove('alerta', 'ok');
    if (dias === null) {
      el.textContent = '⚠️ Nunca has exportado un backup.';
      el.classList.add('alerta');
    } else if (dias >= DIAS_BACKUP) {
      el.textContent = '⚠️ Último backup hace ' + dias + ' días (' + UI.fechaLarga(ub) + '). ¡Toca exportar!';
      el.classList.add('alerta');
    } else {
      el.textContent = '✅ Último backup: ' + UI.fechaLarga(ub) + (dias === 0 ? ' (hoy)' : ' (hace ' + dias + ' día' + (dias === 1 ? '' : 's') + ')');
      el.classList.add('ok');
    }
  }

  $('#btnExportar').addEventListener('click', function () {
    var json = Datos.exportarJSON();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'calenita-backup-' + UI.hoyISO() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Backup exportado. Guárdalo en Drive o WhatsApp.', 'exito', 4000);
    renderBackup();
    actualizarBanner();
  });

  $('#inputImportar').addEventListener('change', function () {
    var archivo = this.files && this.files[0];
    this.value = '';
    if (!archivo) return;
    var lector = new FileReader();
    lector.onload = function () {
      var texto = lector.result;
      var previa;
      try {
        previa = JSON.parse(texto);
      } catch (e) {
        toast('El archivo no es un JSON válido', 'error');
        return;
      }
      var nPed = Array.isArray(previa.pedidos) ? previa.pedidos.length : 0;
      var nGas = Array.isArray(previa.gastos) ? previa.gastos.length : 0;
      var actuales = Datos.pedidos().length;
      UI.confirmar({
        titulo: '¿Importar backup?',
        mensaje: 'El archivo tiene ' + nPed + ' pedidos y ' + nGas + ' gastos. Se reemplazarán los ' + actuales + ' pedidos actuales. Esta acción no se puede deshacer.',
        textoAceptar: 'Sí, importar',
        peligro: true
      }).then(function (ok) {
        if (!ok) return;
        try {
          var r = Datos.importarJSON(texto);
          toast('Importados ' + r.pedidos + ' pedidos y ' + r.gastos + ' gastos', 'exito', 4000);
          refrescarTodo();
        } catch (err) {
          toast(err.message || 'No se pudo importar', 'error');
        }
      });
    };
    lector.onerror = function () { toast('No se pudo leer el archivo', 'error'); };
    lector.readAsText(archivo);
  });

  $('#btnBorrarTodo').addEventListener('click', function () {
    UI.confirmar({
      titulo: '⚠️ ¿Borrar TODO?',
      mensaje: 'Se eliminarán todos los pedidos, gastos y la configuración. Exporta un backup antes si no lo has hecho.',
      textoAceptar: 'Continuar',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      return UI.confirmar({
        titulo: 'Confirmación final',
        mensaje: 'Esta acción es irreversible.',
        textoRequerido: 'BORRAR',
        textoAceptar: 'Borrar todo',
        peligro: true
      }).then(function (ok2) {
        if (!ok2) return;
        Datos.borrarTodo();
        estado.ultimoGanador = null;
        toast('Todos los datos fueron borrados', 'info');
        refrescarTodo();
        irATab('nuevo');
      });
    });
  });

  // ==========================================================
  // INICIO
  // ==========================================================
  // Solo listas y totales: NO toca el formulario que Lina pueda estar llenando
  function refrescarDatos() {
    renderPedidos();
    renderFinanzas();
    renderRifa();
    renderBackup();
    renderListaClientes();
    actualizarBadgePedidos();
    actualizarBanner();
  }

  function refrescarTodo() {
    limpiarFormPedido();
    refrescarDatos();
  }

  // ==========================================================
  // SINCRONIZACIÓN (D1)
  // ==========================================================
  var CADA_MS = 10000;

  function pintarEstadoSync() {
    var e = Datos.estado();
    var punto = $('#syncPunto');
    var texto = $('#syncTexto');
    var clase = 'sync-punto';
    var msg;

    if (e.conexion === 'ok' && !e.pendientes) { msg = 'Al día'; }
    else if (e.pendientes) { clase += ' es-pendiente'; msg = e.pendientes + ' sin subir'; }
    else if (e.conexion === 'sin-red') { clase += ' es-offline'; msg = 'Sin internet'; }
    else if (e.conexion === 'sin-sesion') { clase += ' es-error'; msg = 'Sesión vencida'; }
    else if (e.conexion === 'error') { clase += ' es-error'; msg = 'Error al sincronizar'; }
    else { msg = 'Conectando…'; }

    punto.className = clase;
    texto.textContent = msg;
  }

  var avisoSesion = false;
  function sincronizar(silencioso) {
    return Datos.sincronizar()
      .then(function (r) {
        pintarEstadoSync();
        if (r.cambios && !silencioso) toast('Datos actualizados', 'info');
        return r;
      })
      .catch(function (err) {
        pintarEstadoSync();
        if (err && err.noAutorizado && !avisoSesion) {
          avisoSesion = true;
          toast('La sesión venció, hay que entrar de nuevo', 'error');
          setTimeout(function () { Auth.cerrarSesion(); }, 2500);
        } else if (!silencioso && err && err.red) {
          toast('Sin internet: los cambios se suben solos al volver', 'info');
        }
      });
  }

  // La UI se repinta sola cuando entran datos nuevos o cambia la cola
  Datos.alCambiar(function () {
    pintarEstadoSync();
    refrescarDatos();
  });

  setInterval(function () {
    if (!document.hidden) sincronizar(true);
  }, CADA_MS);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) sincronizar(true);
  });
  window.addEventListener('online', function () { sincronizar(true); });

  construirSabores();
  refrescarTodo();
  pintarEstadoSync();

  // Primera bajada: trae lo que hayan registrado en los otros equipos
  sincronizar(true).then(function () { refrescarDatos(); });

  var tabGuardada = null;
  try { tabGuardada = sessionStorage.getItem('calenita_tab'); } catch (e) { /* ignorar */ }
  if (tabGuardada && $('#tab-' + tabGuardada)) irATab(tabGuardada);
})();
