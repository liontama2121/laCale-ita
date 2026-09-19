/* ==========================================================
   data.js — capa de acceso a localStorage + export/import
   Todo se guarda bajo localStorage['calenita_datos']
   ========================================================== */
(function (global) {
  'use strict';

  var KEY = 'calenita_datos';
  var PRECIO_DEFAULT = 3000;

  // Precios y combos (los sabores se mezclan libremente)
  var PRECIO_UNIDAD = 3000;
  var PRECIO_COMBO_4 = 11000;
  var PRECIO_COMBO_6 = 17000;

  var SABORES = [
    { id: 'carne',    nombre: 'Papa Carne', emoji: '🥩' },
    { id: 'pollo',    nombre: 'Papa Pollo', emoji: '🍗' },
    { id: 'ranchera', nombre: 'Ranchera',   emoji: '🌶️' },
    { id: 'queso',    nombre: 'Queso',      emoji: '🧀' },
    { id: 'mexicana', nombre: 'Mexicana',   emoji: '🌮' }
  ];

  function estadoInicial() {
    return {
      pedidos: [],
      gastos: [],
      config: {
        precioEmpanada: PRECIO_DEFAULT,
        ultimoBackup: null
      }
    };
  }

  // Normaliza cualquier objeto a la forma esperada (útil al importar)
  function normalizar(obj) {
    var base = estadoInicial();
    if (!obj || typeof obj !== 'object') return base;
    base.pedidos = Array.isArray(obj.pedidos) ? obj.pedidos : [];
    base.gastos = Array.isArray(obj.gastos) ? obj.gastos : [];
    if (obj.config && typeof obj.config === 'object') {
      base.config.precioEmpanada = Number(obj.config.precioEmpanada) || PRECIO_DEFAULT;
      base.config.ultimoBackup = obj.config.ultimoBackup || null;
    }
    return base;
  }

  var cache = null;

  function cargar() {
    if (cache) return cache;
    try {
      var raw = localStorage.getItem(KEY);
      cache = raw ? normalizar(JSON.parse(raw)) : estadoInicial();
    } catch (e) {
      console.error('Error leyendo datos, se usa estado vacío', e);
      cache = estadoInicial();
    }
    return cache;
  }

  function guardar() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache || estadoInicial()));
      return true;
    } catch (e) {
      console.error('Error guardando datos', e);
      if (global.mostrarToast) global.mostrarToast('No se pudo guardar. ¿Almacenamiento lleno?', 'error');
      return false;
    }
  }

  function siguienteId(lista) {
    return lista.reduce(function (max, item) { return Math.max(max, Number(item.id) || 0); }, 0) + 1;
  }

  // ---------- Config ----------
  function precio() {
    return cargar().config.precioEmpanada || PRECIO_DEFAULT;
  }

  // ---------- Pedidos ----------
  function pedidos() {
    return cargar().pedidos.slice();
  }

  function numeroRifaUnico() {
    var usados = {};
    cargar().pedidos.forEach(function (p) { if (p.numeroRifa) usados[p.numeroRifa] = true; });
    if (Object.keys(usados).length >= 9000) return null; // agotados (imposible en la práctica)
    var n;
    do {
      n = String(Math.floor(1000 + Math.random() * 9000));
    } while (usados[n]);
    return n;
  }

  var COMBOS = {
    4: PRECIO_COMBO_4,
    6: PRECIO_COMBO_6
  };

  function saboresVacios() {
    var o = {};
    SABORES.forEach(function (s) { o[s.id] = 0; });
    return o;
  }

  function limpiarSabores(sabores) {
    var o = saboresVacios();
    SABORES.forEach(function (s) {
      o[s.id] = Math.max(0, parseInt(sabores && sabores[s.id], 10) || 0);
    });
    return o;
  }

  // Cotiza un pedido: sueltas a precio unidad + combos explícitos a precio fijo.
  // combos: [{ tipo: 4|6, sabores: {carne: 2, queso: 2} }]
  // No aplica combos automáticamente: 10 sueltas = 10 × $3.000.
  function cotizar(sueltas, combos) {
    sueltas = limpiarSabores(sueltas);
    combos = Array.isArray(combos) ? combos : [];
    var nSueltas = totalDeSabores(sueltas);
    var precio = nSueltas * PRECIO_UNIDAD;
    var totalEmpanadas = nSueltas;
    var desglose = { c6: 0, c4: 0, sueltas: nSueltas };
    var errores = [];
    var combosLimpios = combos.map(function (c, idx) {
      var tipo = Number(c.tipo);
      var sab = limpiarSabores(c.sabores);
      var n = totalDeSabores(sab);
      if (!COMBOS[tipo]) errores.push('Combo #' + (idx + 1) + ' inválido');
      else if (n !== tipo) errores.push('Combo x' + tipo + ' #' + (idx + 1) + ' tiene ' + n + ' de ' + tipo + ' empanadas');
      precio += COMBOS[tipo] || 0;
      totalEmpanadas += n;
      if (tipo === 6) desglose.c6++;
      if (tipo === 4) desglose.c4++;
      return { tipo: tipo, precio: COMBOS[tipo] || 0, sabores: sab };
    });
    return {
      precio: precio,
      totalEmpanadas: totalEmpanadas,
      ahorro: totalEmpanadas * PRECIO_UNIDAD - precio,
      desglose: desglose,
      sueltas: sueltas,
      combos: combosLimpios,
      errores: errores
    };
  }

  function textoDesglose(d) {
    if (!d) return 'Sin empanadas';
    var partes = [];
    if (d.c6 > 0) partes.push(d.c6 + ' combo' + (d.c6 > 1 ? 's' : '') + ' x6');
    if (d.c4 > 0) partes.push(d.c4 + ' combo' + (d.c4 > 1 ? 's' : '') + ' x4');
    if (d.sueltas > 0) partes.push(d.sueltas + ' suelta' + (d.sueltas > 1 ? 's' : ''));
    return partes.join(' + ') || 'Sin empanadas';
  }

  // Texto corto solo de combos, para etiquetas ("combo x4", "2 combos x6 + combo x4")
  function textoCombos(d) {
    if (!d) return '';
    var partes = [];
    if (d.c6 > 0) partes.push((d.c6 > 1 ? d.c6 + ' combos' : 'combo') + ' x6');
    if (d.c4 > 0) partes.push((d.c4 > 1 ? d.c4 + ' combos' : 'combo') + ' x4');
    return partes.join(' + ');
  }

  function totalDeSabores(sabores) {
    var cant = 0;
    SABORES.forEach(function (s) { cant += Number(sabores[s.id]) || 0; });
    return cant;
  }

  // ---------- Clientes ----------
  // Los clientes no se guardan aparte: se derivan de los pedidos existentes.
  // Clave sin tildes, espacios dobles ni mayúsculas para no repetir "María" / "maria".
  // Rango de marcas diacríticas (U+0300–U+036F) construido sin escapes para que ningún editor lo altere
  var TILDES = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
  function claveCliente(nombre) {
    return String(nombre || '')
      .normalize('NFD').replace(TILDES, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  // Lista única de clientes con sus datos más recientes y cantidad de pedidos
  function clientes() {
    var mapa = {};
    cargar().pedidos.forEach(function (p) {
      var clave = claveCliente(p.cliente);
      if (!clave) return;
      var c = mapa[clave];
      if (!c) {
        c = mapa[clave] = { clave: clave, nombre: '', conjunto: '', torre: '', apartamento: '', pedidos: 0, ultimoPedido: '' };
      }
      c.pedidos++;
      // El pedido más reciente manda en nombre y dirección
      if (!c.ultimoPedido || p.fecha > c.ultimoPedido) {
        c.ultimoPedido = p.fecha;
        c.nombre = p.cliente;
        if (p.conjunto) c.conjunto = p.conjunto;
        if (p.torre) c.torre = p.torre;
        if (p.apartamento) c.apartamento = p.apartamento;
      }
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; })
      .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
  }

  function buscarCliente(nombre) {
    var clave = claveCliente(nombre);
    if (!clave) return null;
    return clientes().find(function (c) { return c.clave === clave; }) || null;
  }

  function agregarPedido(datos) {
    var d = cargar();
    // Compatibilidad: si llega solo `sabores` (formato viejo), se tratan como sueltas
    var cot = cotizar(datos.sueltas || datos.sabores, datos.combos);
    if (cot.errores.length) throw new Error(cot.errores[0]);
    // Totales por sabor (sueltas + combos) para resumen y conteo de empanadas
    var totales = limpiarSabores(cot.sueltas);
    cot.combos.forEach(function (c) {
      SABORES.forEach(function (s) { totales[s.id] += c.sabores[s.id]; });
    });
    var pedido = {
      id: siguienteId(d.pedidos),
      fecha: new Date().toISOString(),
      // Si el cliente ya existe se usa el nombre como está guardado, para no duplicarlo
      cliente: (buscarCliente(datos.cliente) || {}).nombre || String(datos.cliente || '').trim(),
      conjunto: String(datos.conjunto || '').trim(),
      torre: String(datos.torre || '').trim(),
      apartamento: String(datos.apartamento || '').trim(),
      sabores: totales,
      sueltas: cot.sueltas,
      combos: cot.combos,
      total: cot.precio,
      totalEmpanadas: cot.totalEmpanadas,
      desgloseCombo: cot.desglose,
      ahorroCombo: cot.ahorro,
      pagado: !!datos.pagado,
      numeroRifa: numeroRifaUnico(),
      notas: String(datos.notas || '').trim()
    };
    d.pedidos.push(pedido);
    guardar();
    return pedido;
  }

  function marcarPagado(id, valor) {
    var d = cargar();
    var p = d.pedidos.find(function (x) { return x.id === id; });
    if (!p) return null;
    p.pagado = valor === undefined ? true : !!valor;
    guardar();
    return p;
  }

  function eliminarPedido(id) {
    var d = cargar();
    var antes = d.pedidos.length;
    d.pedidos = d.pedidos.filter(function (x) { return x.id !== id; });
    guardar();
    return d.pedidos.length < antes;
  }

  // ---------- Gastos ----------
  function gastos() {
    return cargar().gastos.slice();
  }

  function agregarGasto(datos) {
    var d = cargar();
    var gasto = {
      id: siguienteId(d.gastos),
      fecha: datos.fecha || new Date().toISOString().slice(0, 10),
      tipo: datos.tipo === 'otro' ? 'otro' : 'inversion',
      descripcion: String(datos.descripcion || '').trim(),
      monto: Math.max(0, Number(datos.monto) || 0)
    };
    d.gastos.push(gasto);
    guardar();
    return gasto;
  }

  function eliminarGasto(id) {
    var d = cargar();
    var antes = d.gastos.length;
    d.gastos = d.gastos.filter(function (x) { return x.id !== id; });
    guardar();
    return d.gastos.length < antes;
  }

  // ---------- Rifa ----------
  function reiniciarRifa() {
    var d = cargar();
    d.pedidos.forEach(function (p) { p.numeroRifa = null; });
    guardar();
  }

  // ---------- Resumen financiero ----------
  // rango: 'hoy' | 'semana' | 'mes' | 'todo'
  function inicioRango(rango) {
    var ahora = new Date();
    var ini = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    if (rango === 'hoy') return ini;
    if (rango === 'semana') {
      // Semana inicia lunes
      var dia = ini.getDay(); // 0 dom … 6 sab
      var resta = dia === 0 ? 6 : dia - 1;
      ini.setDate(ini.getDate() - resta);
      return ini;
    }
    if (rango === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return null;
  }

  function fechaGastoLocal(str) {
    // 'YYYY-MM-DD' → Date local a medianoche
    var partes = String(str || '').split('-');
    if (partes.length !== 3) return new Date(str);
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }

  function resumen(rango) {
    var d = cargar();
    var desde = inicioRango(rango || 'todo');
    var r = { cobrado: 0, porCobrar: 0, gastos: 0, inversion: 0, otros: 0, empanadas: 0, pedidos: 0, utilidad: 0 };

    d.pedidos.forEach(function (p) {
      if (desde && new Date(p.fecha) < desde) return;
      r.pedidos++;
      r.empanadas += totalDeSabores(p.sabores || {});
      if (p.pagado) r.cobrado += Number(p.total) || 0;
      else r.porCobrar += Number(p.total) || 0;
    });

    d.gastos.forEach(function (g) {
      if (desde && fechaGastoLocal(g.fecha) < desde) return;
      var m = Number(g.monto) || 0;
      r.gastos += m;
      if (g.tipo === 'otro') r.otros += m; else r.inversion += m;
    });

    r.utilidad = r.cobrado - r.gastos;
    return r;
  }

  // ---------- Backup ----------
  function exportarJSON() {
    var d = cargar();
    d.config.ultimoBackup = new Date().toISOString();
    guardar();
    var payload = {
      pedidos: d.pedidos,
      gastos: d.gastos,
      config: d.config,
      fecha_export: d.config.ultimoBackup,
      app: 'La Caleñita',
      version: 1
    };
    return JSON.stringify(payload, null, 2);
  }

  function importarJSON(texto) {
    var obj;
    try {
      obj = JSON.parse(texto);
    } catch (e) {
      throw new Error('El archivo no es un JSON válido');
    }
    if (!obj || typeof obj !== 'object' || (!Array.isArray(obj.pedidos) && !Array.isArray(obj.gastos))) {
      throw new Error('El archivo no parece un backup de La Caleñita');
    }
    cache = normalizar(obj);
    // Un import cuenta como backup reciente (los datos ya existen en archivo)
    if (!cache.config.ultimoBackup) cache.config.ultimoBackup = new Date().toISOString();
    guardar();
    return { pedidos: cache.pedidos.length, gastos: cache.gastos.length };
  }

  function diasDesdeBackup() {
    var ub = cargar().config.ultimoBackup;
    if (!ub) return null; // nunca
    var ms = Date.now() - new Date(ub).getTime();
    return Math.floor(ms / 86400000);
  }

  function borrarTodo() {
    cache = estadoInicial();
    localStorage.removeItem(KEY);
  }

  global.Datos = {
    SABORES: SABORES,
    PRECIOS: { unidad: PRECIO_UNIDAD, combo4: PRECIO_COMBO_4, combo6: PRECIO_COMBO_6 },
    COMBOS: COMBOS,
    precio: precio,
    cotizar: cotizar,
    saboresVacios: saboresVacios,
    textoDesglose: textoDesglose,
    textoCombos: textoCombos,
    cargar: cargar,
    pedidos: pedidos,
    agregarPedido: agregarPedido,
    clientes: clientes,
    buscarCliente: buscarCliente,
    marcarPagado: marcarPagado,
    eliminarPedido: eliminarPedido,
    totalDeSabores: totalDeSabores,
    gastos: gastos,
    agregarGasto: agregarGasto,
    eliminarGasto: eliminarGasto,
    reiniciarRifa: reiniciarRifa,
    resumen: resumen,
    exportarJSON: exportarJSON,
    importarJSON: importarJSON,
    diasDesdeBackup: diasDesdeBackup,
    borrarTodo: borrarTodo
  };
})(window);
