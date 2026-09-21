-- Esquema inicial de La Caleñita.
-- `actualizado` (ms epoch, lo pone el servidor) es el cursor de sincronización.
-- `borrado` es una lápida: el registro se conserva para que el borrado viaje a los demás equipos.

CREATE TABLE IF NOT EXISTS pedidos (
  id              TEXT PRIMARY KEY,
  fecha           TEXT    NOT NULL,
  cliente         TEXT    NOT NULL DEFAULT '',
  conjunto        TEXT    NOT NULL DEFAULT '',
  torre           TEXT    NOT NULL DEFAULT '',
  apartamento     TEXT    NOT NULL DEFAULT '',
  sabores         TEXT    NOT NULL DEFAULT '{}',
  sueltas         TEXT    NOT NULL DEFAULT '{}',
  combos          TEXT    NOT NULL DEFAULT '[]',
  total           INTEGER NOT NULL DEFAULT 0,
  total_empanadas INTEGER NOT NULL DEFAULT 0,
  desglose_combo  TEXT    NOT NULL DEFAULT '{}',
  ahorro_combo    INTEGER NOT NULL DEFAULT 0,
  pagado          INTEGER NOT NULL DEFAULT 0,
  numero_rifa     TEXT,
  notas           TEXT    NOT NULL DEFAULT '',
  actualizado     INTEGER NOT NULL,
  borrado         INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pedidos_actualizado ON pedidos(actualizado);
-- Parcial: solo los vivos con número. Dos equipos offline pueden sortear el mismo
-- número; el servidor detecta el choque contra este índice y reasigna.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_rifa
  ON pedidos(numero_rifa) WHERE numero_rifa IS NOT NULL AND borrado = 0;

CREATE TABLE IF NOT EXISTS gastos (
  id          TEXT PRIMARY KEY,
  fecha       TEXT    NOT NULL,
  tipo        TEXT    NOT NULL DEFAULT 'inversion',
  descripcion TEXT    NOT NULL DEFAULT '',
  monto       INTEGER NOT NULL DEFAULT 0,
  actualizado INTEGER NOT NULL,
  borrado     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_gastos_actualizado ON gastos(actualizado);

CREATE TABLE IF NOT EXISTS config (
  clave       TEXT PRIMARY KEY,
  valor       TEXT NOT NULL,
  actualizado INTEGER NOT NULL
);
