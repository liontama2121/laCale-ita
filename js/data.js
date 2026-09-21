/* ==========================================================
   data.js — capa de datos: caché en localStorage + sincronización con D1.
   localStorage['calenita_datos'] es la caché local (y lo que se ve sin internet).
   localStorage['calenita_sync']  guarda el cursor y la cola de cambios sin subir.
   La fuente de verdad compartida es D1, vía /api/sync.
   ========================================================== */
(function (global) {
  'use strict';

  var KEY = 'calenita_datos';
  var KEY_SYNC = 'calenita_sync';
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
  // Los ids se fuerzan a texto: los viejos eran números y los nuevos son UUID.
  function normalizar(obj) {
    var base = estadoInicial();
    if (!obj || typeof obj !== 'object') return base;
    base.pedidos = (Array.isArray(obj.pedidos) ? obj.pedidos : []).map(conIdTexto);
    base.gastos = (Array.isArray(obj.gastos) ? obj.gastos : []).map(conIdTexto);
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

  function conIdTexto(item) {
    if (item && item.id != null) item.id = String(item.id);
    return item;
  }

  // UUID: dos equipos sin señal no pueden generar el mismo id (los correlativos sí chocaban)
  function nuevoId() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ---------- Cola de sincronización ----------
  // pendientes: { pedidos: { <id>: 'upsert' | 'borrar' }, gastos: {...}, config: bool }
  var sync = null;

  function estadoSyncInicial() {
    return { cursor: 0, pendientes: { pedidos: {}, gastos: {}, config: false } };
  }

  function cargarSync() {
    if (sync) return sync;
    try {
      var raw = localStorage.getItem(KEY_SYNC);
      var s = raw ? JSON.parse(raw) : null;
      sync = s && typeof s === 'object' ? s : estadoSyncInicial();
      sync.cursor = Number(sync.cursor) || 0;
      if (!sync.pendientes || typeof sync.pendientes !== 'object') sync.pendientes = { pedidos: {}, gastos: {}, config: false };
      if (!sync.pendientes.pedidos) sync.pendientes.pedidos = {};
      if (!sync.pendientes.gastos) sync.pendientes.gastos = {};
    } catch (e) {
      sync = estadoSyncInicial();
    }
    return sync;
  }

  function guardarSync() {
    try {
      localStorage.setItem(KEY_SYNC, JSON.stringify(sync || estadoSyncInicial()));
    } catch (e) { /* sin espacio: la cola se pierde, los datos locales no */ }
  }

  function marcar(tipo, id, accion) {
    var s = cargarSync();
    if (tipo === 'config') s.pendientes.config = true;
    else s.pendientes[tipo][String(id)] = accion || 'upsert';
    guardarSync();
    avisarCambio();
  }

  function haySinSubir() {
    var s = cargarSync();
    return Object.keys(s.pendientes.pedidos).length + Object.keys(s.pendientes.gastos).length > 0 || !!s.pendientes.config;
  }

  // ---------- Avisos a la interfaz ----------
  var oyentes = [];
  var callado = 0;

  function alCambiar(fn) {
    if (typeof fn === 'function') oyentes.push(fn);
  }

  function avisarCambio() {
    if (callado > 0) return;
    oyentes.forEach(function (fn) {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  // Agrupa una operación masiva en un solo aviso a la UI
  function enLote(fn) {
    callado++;
    try { return fn(); } finally {
      callado--;
      avisarCambio();
    }
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
      id: nuevoId(),
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
    marcar('pedidos', pedido.id, 'upsert');
    return pedido;
  }

  function marcarPagado(id, valor) {
    var d = cargar();
    var p = d.pedidos.find(function (x) { return String(x.id) === String(id); });
    if (!p) return null;
    p.pagado = valor === undefined ? true : !!valor;
    guardar();
    marcar('pedidos', p.id, 'upsert');
    return p;
  }

  function eliminarPedido(id) {
    var d = cargar();
    var antes = d.pedidos.length;
    d.pedidos = d.pedidos.filter(function (x) { return String(x.id) !== String(id); });
    guardar();
    if (d.pedidos.length < antes) marcar('pedidos', id, 'borrar');
    return d.pedidos.length < antes;
  }

  // ---------- Gastos ----------
  function gastos() {
    return cargar().gastos.slice();
  }

  function agregarGasto(datos) {
    var d = cargar();
    var gasto = {
      id: nuevoId(),
      fecha: datos.fecha || new Date().toISOString().slice(0, 10),
      tipo: datos.tipo === 'otro' ? 'otro' : 'inversion',
      descripcion: String(datos.descripcion || '').trim(),
      monto: Math.max(0, Number(datos.monto) || 0)
    };
    d.gastos.push(gasto);
    guardar();
    marcar('gastos', gasto.id, 'upsert');
    return gasto;
  }

  function eliminarGasto(id) {
    var d = cargar();
    var antes = d.gastos.length;
    d.gastos = d.gastos.filter(function (x) { return String(x.id) !== String(id); });
    guardar();
    if (d.gastos.length < antes) marcar('gastos', id, 'borrar');
    return d.gastos.length < antes;
  }

  // ---------- Rifa ----------
  function reiniciarRifa() {
    var d = cargar();
    enLote(function () {
      d.pedidos.forEach(function (p) {
        p.numeroRifa = null;
        marcar('pedidos', p.id, 'upsert');
      });
      guardar();
    });
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
    marcar('config');
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
    // Lo importado se sube entero: el import manda sobre lo que haya en el servidor
    enLote(function () {
      cache.pedidos.forEach(function (p) { marcar('pedidos', p.id, 'upsert'); });
      cache.gastos.forEach(function (g) { marcar('gastos', g.id, 'upsert'); });
      marcar('config');
    });
    return { pedidos: cache.pedidos.length, gastos: cache.gastos.length };
  }

  function diasDesdeBackup() {
    var ub = cargar().config.ultimoBackup;
    if (!ub) return null; // nunca
    var ms = Date.now() - new Date(ub).getTime();
    return Math.floor(ms / 86400000);
  }

  // Borra en este equipo Y en el servidor (viaja como lápida a los demás)
  function borrarTodo() {
    var d = cargar();
    enLote(function () {
      d.pedidos.forEach(function (p) { marcar('pedidos', p.id, 'borrar'); });
      d.gastos.forEach(function (g) { marcar('gastos', g.id, 'borrar'); });
    });
    cache = estadoInicial();
    localStorage.removeItem(KEY);
    avisarCambio();
  }

  // ==========================================================
  // Sincronización con D1
  // ==========================================================
  var sincronizando = null;   // promesa en curso, para no pisarse
  var estadoConexion = 'sin-probar'; // 'ok' | 'sin-red' | 'sin-sesion' | 'error'

  function estado() {
    return {
      conexion: estadoConexion,
      pendientes: cantidadPendientes(),
      cursor: cargarSync().cursor
    };
  }

  function cantidadPendientes() {
    var s = cargarSync();
    return Object.keys(s.pendientes.pedidos).length + Object.keys(s.pendientes.gastos).length;
  }

  // Arma el lote a subir leyendo los registros vivos de la caché
  function armarLote() {
    var d = cargar();
    var s = cargarSync();
    var lote = { desde: s.cursor, pedidos: [], gastos: [], config: {} };

    Object.keys(s.pendientes.pedidos).forEach(function (id) {
      if (s.pendientes.pedidos[id] === 'borrar') {
        lote.pedidos.push({ id: id, borrado: true });
        return;
      }
      var p = d.pedidos.find(function (x) { return String(x.id) === id; });
      if (p) lote.pedidos.push(p);
    });

    Object.keys(s.pendientes.gastos).forEach(function (id) {
      if (s.pendientes.gastos[id] === 'borrar') {
        lote.gastos.push({ id: id, borrado: true });
        return;
      }
      var g = d.gastos.find(function (x) { return String(x.id) === id; });
      if (g) lote.gastos.push(g);
    });

    if (s.pendientes.config) {
      lote.config = {
        precioEmpanada: d.config.precioEmpanada,
        ultimoBackup: d.config.ultimoBackup
      };
    }
    return lote;
  }

  // Aplica lo que devolvió el servidor. Si un registro sigue en la cola local
  // (se tocó mientras subíamos), manda lo local: se sube en la próxima vuelta.
  function aplicarDelServidor(resp) {
    var d = cargar();
    var s = cargarSync();
    var cambios = 0;

    (resp.pedidos || []).forEach(function (p) {
      if (s.pendientes.pedidos[String(p.id)]) return;
      var i = d.pedidos.findIndex(function (x) { return String(x.id) === String(p.id); });
      if (p.borrado) {
        if (i >= 0) { d.pedidos.splice(i, 1); cambios++; }
        return;
      }
      delete p.borrado;
      if (i >= 0) d.pedidos[i] = p; else d.pedidos.push(p);
      cambios++;
    });

    (resp.gastos || []).forEach(function (g) {
      if (s.pendientes.gastos[String(g.id)]) return;
      var i = d.gastos.findIndex(function (x) { return String(x.id) === String(g.id); });
      if (g.borrado) {
        if (i >= 0) { d.gastos.splice(i, 1); cambios++; }
        return;
      }
      delete g.borrado;
      if (i >= 0) d.gastos[i] = g; else d.gastos.push(g);
      cambios++;
    });

    if (resp.config && !s.pendientes.config) {
      if (resp.config.precioEmpanada != null) d.config.precioEmpanada = Number(resp.config.precioEmpanada) || PRECIO_DEFAULT;
      if (resp.config.ultimoBackup !== undefined) d.config.ultimoBackup = resp.config.ultimoBackup;
    }

    d.pedidos.sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
    guardar();
    return cambios;
  }

  /* Sincroniza en los dos sentidos.
     Devuelve { ok, cambios, pendientes } o lanza si no hay red/sesión.
     Nunca borra datos locales por un fallo de red: la cola espera. */
  /* Primera sincronización de un equipo que YA tenía pedidos guardados de la
     época en que todo vivía en el navegador. Esos registros nunca pasaron por
     la cola, así que sin esto se quedarían encerrados en ese equipo para
     siempre. Se suben SOLO los que el servidor no conoce: si un id ya existe
     allá, manda el servidor, porque otro equipo pudo haberlo corregido y una
     caché vieja no puede pisar esa corrección. */
  function rescatarHuerfanos() {
    var s = cargarSync();
    if (s.migrado) return Promise.resolve();

    var d = cargar();
    if (!d.pedidos.length && !d.gastos.length) {
      s.migrado = true;
      guardarSync();
      return Promise.resolve();
    }

    return global.Api.bajar(0).then(function (resp) {
      var enServidor = { pedidos: {}, gastos: {} };
      (resp.pedidos || []).forEach(function (p) { enServidor.pedidos[String(p.id)] = true; });
      (resp.gastos || []).forEach(function (g) { enServidor.gastos[String(g.id)] = true; });

      var rescatados = 0;
      enLote(function () {
        d.pedidos.forEach(function (p) {
          if (!enServidor.pedidos[String(p.id)]) { marcar('pedidos', p.id, 'upsert'); rescatados++; }
        });
        d.gastos.forEach(function (g) {
          if (!enServidor.gastos[String(g.id)]) { marcar('gastos', g.id, 'upsert'); rescatados++; }
        });
      });

      s.migrado = true;
      guardarSync();
      if (rescatados) console.info('Sincronización: ' + rescatados + ' registro(s) locales que faltaban en el servidor');
      return rescatados;
    });
  }

  function sincronizar() {
    if (!global.Api) return Promise.reject(new Error('Falta api.js'));
    if (sincronizando) return sincronizando;

    var s = cargarSync();
    var enviados;

    sincronizando = rescatarHuerfanos()
      .then(function () {
        // El lote se arma DESPUÉS del rescate, para que incluya lo recuperado
        var lote = armarLote();
        var subeAlgo = lote.pedidos.length || lote.gastos.length || Object.keys(lote.config).length;
        enviados = {
          pedidos: Object.keys(s.pendientes.pedidos),
          gastos: Object.keys(s.pendientes.gastos),
          config: s.pendientes.config,
          subeAlgo: subeAlgo
        };
        return subeAlgo ? global.Api.subir(lote) : global.Api.bajar(s.cursor);
      })
      .then(function (resp) {
        var subeAlgo = enviados.subeAlgo;
        // Solo se limpia lo que efectivamente se envió: lo tocado mientras tanto queda
        if (subeAlgo) {
          enviados.pedidos.forEach(function (id) { delete s.pendientes.pedidos[id]; });
          enviados.gastos.forEach(function (id) { delete s.pendientes.gastos[id]; });
          if (enviados.config) s.pendientes.config = false;
          guardarSync();
        }
        var cambios = aplicarDelServidor(resp);
        s.cursor = Number(resp.ahora) || s.cursor;
        guardarSync();
        estadoConexion = 'ok';
        // Siempre se avisa, aunque no entren datos nuevos: vaciar la cola también
        // es un cambio de estado y si no, el indicador queda mintiendo
        // ("N sin subir" con la cola ya vacía).
        avisarCambio();
        return { ok: true, cambios: cambios, pendientes: cantidadPendientes() };
      })
      .catch(function (err) {
        estadoConexion = err && err.red ? 'sin-red' : (err && err.noAutorizado ? 'sin-sesion' : 'error');
        avisarCambio();
        throw err;
      })
      .then(function (r) { sincronizando = null; return r; }, function (e) { sincronizando = null; throw e; });

    return sincronizando;
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
    borrarTodo: borrarTodo,
    // --- sincronización ---
    sincronizar: sincronizar,
    estado: estado,
    haySinSubir: haySinSubir,
    alCambiar: alCambiar
  };
})(window);
