/* ==========================================================
   /api/sync — sincronización de pedidos, gastos y config contra D1.

   GET  /api/sync?desde=<ms>   → cambios desde ese cursor
   POST /api/sync              → sube cambios locales y devuelve los del servidor

   El cursor es `actualizado`, siempre en reloj del SERVIDOR: así los relojes
   desfasados de los equipos no rompen el orden. Gana la última escritura que llega.
   Los borrados viajan como lápidas (borrado = 1), nunca se borra la fila.
   ========================================================== */

const MAX_LOTE = 400; // tope de registros por request

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function txt(v, max) {
  return String(v == null ? '' : v).slice(0, max || 200);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function jsonCampo(v, porDefecto) {
  try {
    return JSON.stringify(v == null ? JSON.parse(porDefecto) : v);
  } catch (e) {
    return porDefecto;
  }
}

function parsear(s, porDefecto) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return porDefecto;
  }
}

// ---------- fila D1 → objeto de la app ----------
function filaAPedido(f) {
  return {
    id: f.id,
    fecha: f.fecha,
    cliente: f.cliente,
    conjunto: f.conjunto,
    torre: f.torre,
    apartamento: f.apartamento,
    sabores: parsear(f.sabores, {}),
    sueltas: parsear(f.sueltas, {}),
    combos: parsear(f.combos, []),
    total: f.total,
    totalEmpanadas: f.total_empanadas,
    desgloseCombo: parsear(f.desglose_combo, {}),
    ahorroCombo: f.ahorro_combo,
    pagado: !!f.pagado,
    numeroRifa: f.numero_rifa,
    notas: f.notas,
    actualizado: f.actualizado,
    borrado: !!f.borrado
  };
}

function filaAGasto(f) {
  return {
    id: f.id,
    fecha: f.fecha,
    tipo: f.tipo,
    descripcion: f.descripcion,
    monto: f.monto,
    actualizado: f.actualizado,
    borrado: !!f.borrado
  };
}

async function leerCambios(db, desde) {
  const [pedidos, gastos, config] = await db.batch([
    db.prepare('SELECT * FROM pedidos WHERE actualizado >= ? ORDER BY actualizado').bind(desde),
    db.prepare('SELECT * FROM gastos WHERE actualizado >= ? ORDER BY actualizado').bind(desde),
    db.prepare('SELECT * FROM config WHERE actualizado >= ?').bind(desde)
  ]);

  const cfg = {};
  for (const f of config.results) cfg[f.clave] = parsear(f.valor, null);

  return {
    pedidos: pedidos.results.map(filaAPedido),
    gastos: gastos.results.map(filaAGasto),
    config: cfg
  };
}

// Dos equipos sin señal pueden sortear el mismo número: el que llega segundo
// recibe otro libre y el cambio le vuelve por la sincronización.
async function rifaLibre(db, propuesto, id) {
  if (!propuesto) return null;
  const choque = await db
    .prepare('SELECT id FROM pedidos WHERE numero_rifa = ? AND borrado = 0 AND id != ?')
    .bind(String(propuesto), id)
    .first();
  if (!choque) return String(propuesto);

  const usados = await db.prepare('SELECT numero_rifa FROM pedidos WHERE numero_rifa IS NOT NULL AND borrado = 0').all();
  const set = new Set(usados.results.map((f) => f.numero_rifa));
  if (set.size >= 9000) return null;
  let n;
  do {
    n = String(Math.floor(1000 + Math.random() * 9000));
  } while (set.has(n));
  return n;
}

async function aplicarPedidos(db, lista, ahora) {
  const stmts = [];
  for (const p of lista) {
    const id = txt(p && p.id, 64);
    if (!id) continue;

    if (p.borrado) {
      stmts.push(
        db.prepare('UPDATE pedidos SET borrado = 1, numero_rifa = NULL, actualizado = ? WHERE id = ?').bind(ahora, id)
      );
      continue;
    }

    const rifa = await rifaLibre(db, p.numeroRifa, id);
    stmts.push(
      db
        .prepare(
          `INSERT INTO pedidos (id, fecha, cliente, conjunto, torre, apartamento, sabores, sueltas,
             combos, total, total_empanadas, desglose_combo, ahorro_combo, pagado, numero_rifa,
             notas, actualizado, borrado)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET
             fecha = excluded.fecha, cliente = excluded.cliente, conjunto = excluded.conjunto,
             torre = excluded.torre, apartamento = excluded.apartamento, sabores = excluded.sabores,
             sueltas = excluded.sueltas, combos = excluded.combos, total = excluded.total,
             total_empanadas = excluded.total_empanadas, desglose_combo = excluded.desglose_combo,
             ahorro_combo = excluded.ahorro_combo, pagado = excluded.pagado,
             numero_rifa = excluded.numero_rifa, notas = excluded.notas,
             actualizado = excluded.actualizado, borrado = 0`
        )
        .bind(
          id,
          txt(p.fecha, 40),
          txt(p.cliente, 120),
          txt(p.conjunto, 120),
          txt(p.torre, 40),
          txt(p.apartamento, 40),
          jsonCampo(p.sabores, '{}'),
          jsonCampo(p.sueltas, '{}'),
          jsonCampo(p.combos, '[]'),
          num(p.total),
          num(p.totalEmpanadas),
          jsonCampo(p.desgloseCombo, '{}'),
          num(p.ahorroCombo),
          p.pagado ? 1 : 0,
          rifa,
          txt(p.notas, 500),
          ahora
        )
    );
  }
  return stmts;
}

function aplicarGastos(db, lista, ahora) {
  const stmts = [];
  for (const g of lista) {
    const id = txt(g && g.id, 64);
    if (!id) continue;

    if (g.borrado) {
      stmts.push(db.prepare('UPDATE gastos SET borrado = 1, actualizado = ? WHERE id = ?').bind(ahora, id));
      continue;
    }

    stmts.push(
      db
        .prepare(
          `INSERT INTO gastos (id, fecha, tipo, descripcion, monto, actualizado, borrado)
           VALUES (?,?,?,?,?,?,0)
           ON CONFLICT(id) DO UPDATE SET
             fecha = excluded.fecha, tipo = excluded.tipo, descripcion = excluded.descripcion,
             monto = excluded.monto, actualizado = excluded.actualizado, borrado = 0`
        )
        .bind(
          id,
          txt(g.fecha, 40),
          g.tipo === 'otro' ? 'otro' : 'inversion',
          txt(g.descripcion, 300),
          Math.max(0, num(g.monto)),
          ahora
        )
    );
  }
  return stmts;
}

function aplicarConfig(db, cfg, ahora) {
  const stmts = [];
  for (const clave of Object.keys(cfg || {})) {
    stmts.push(
      db
        .prepare(
          `INSERT INTO config (clave, valor, actualizado) VALUES (?,?,?)
           ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`
        )
        .bind(txt(clave, 60), JSON.stringify(cfg[clave] == null ? null : cfg[clave]), ahora)
    );
  }
  return stmts;
}

export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (!env.DB) return json({ error: 'Falta el binding DB de D1' }, 500);

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const desde = Math.max(0, num(url.searchParams.get('desde')));
    const ahora = Date.now();
    const cambios = await leerCambios(env.DB, desde);
    return json({ ahora, ...cambios });
  }

  if (request.method !== 'POST') return json({ error: 'Usá GET o POST' }, 405);

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const pedidos = Array.isArray(cuerpo.pedidos) ? cuerpo.pedidos : [];
  const gastos = Array.isArray(cuerpo.gastos) ? cuerpo.gastos : [];
  const config = cuerpo.config && typeof cuerpo.config === 'object' ? cuerpo.config : {};

  if (pedidos.length + gastos.length > MAX_LOTE) {
    return json({ error: 'Demasiados cambios de una vez (máx ' + MAX_LOTE + ')' }, 413);
  }

  const ahora = Date.now();
  const stmts = [
    ...(await aplicarPedidos(env.DB, pedidos, ahora)),
    ...aplicarGastos(env.DB, gastos, ahora),
    ...aplicarConfig(env.DB, config, ahora)
  ];

  if (stmts.length) await env.DB.batch(stmts);

  // El cursor que manda el equipo puede ser viejo: devolvemos todo lo que cambió
  // desde entonces, incluido lo que él mismo acaba de subir (así adopta el número
  // de rifa reasignado y la marca de tiempo del servidor).
  const desde = Math.max(0, num(cuerpo.desde));
  const cambios = await leerCambios(env.DB, desde);
  return json({ ahora, aplicados: stmts.length, ...cambios });
}
