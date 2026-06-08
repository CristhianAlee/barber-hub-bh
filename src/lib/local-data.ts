import { mockTables } from "@/mock/data";

// ── In-memory store (deep-cloned from mock to allow mutations)
const tables: Record<string, Record<string, unknown>[]> = {};

function initStore() {
  Object.entries(mockTables).forEach(([key, rows]) => {
    tables[key] = rows.map((row) => ({ ...row }));
  });
}

initStore();

// ── Types
const LOCAL_AUTH_STORAGE_KEY = "barberhub.localAuth";

type QueryResult<T = unknown> = { data: T; error: null } | { data: null; error: { message: string; code?: string } };

function ok<T>(data: T): QueryResult<T> {
  return { data, error: null };
}

// ── Select parser
// Parses "col1, col2, table1(col3, col4)" into cols and join specs
interface JoinSpec {
  alias: string;   // e.g. "clients"
  cols: string[];  // e.g. ["name", "phone"]
}

function parseSelect(sel: string): { cols: string[]; joins: JoinSpec[] } {
  const cols: string[] = [];
  const joins: JoinSpec[] = [];
  let depth = 0;
  let cur = "";
  const flush = () => {
    const part = cur.trim();
    cur = "";
    if (!part) return;
    const m = part.match(/^(\w+)\((.+)\)$/s);
    if (m) {
      joins.push({ alias: m[1], cols: m[2].split(",").map((c) => c.trim()).filter(Boolean) });
    } else {
      cols.push(part);
    }
  };
  for (const ch of sel + ",") {
    if (ch === "(") { depth++; cur += ch; }
    else if (ch === ")") { depth--; cur += ch; }
    else if (ch === "," && depth === 0) { flush(); }
    else { cur += ch; }
  }
  return { cols, joins };
}

// ── Filter application
interface Filter {
  col: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "in" | "is";
  val: unknown;
}

function matchesFilter(row: Record<string, unknown>, f: Filter): boolean {
  const val = row[f.col];
  switch (f.op) {
    case "eq": return val === f.val;
    case "neq": return val !== f.val;
    case "gt": return String(val) > String(f.val);
    case "gte": return String(val) >= String(f.val);
    case "lt": return String(val) < String(f.val);
    case "lte": return String(val) <= String(f.val);
    case "ilike": {
      if (typeof val !== "string" || typeof f.val !== "string") return false;
      const pattern = (f.val as string).replace(/%/g, "").toLowerCase();
      return val.toLowerCase().includes(pattern);
    }
    case "in": return Array.isArray(f.val) && (f.val as unknown[]).includes(val);
    case "is": return f.val === null ? (val === null || val === undefined) : val === f.val;
    default: return true;
  }
}

// ── Column picker
function pickCols(row: Record<string, unknown>, cols: string[]): Record<string, unknown> {
  if (!cols.length || (cols.length === 1 && cols[0] === "*")) return { ...row };
  return cols.reduce((acc, c) => { acc[c] = row[c]; return acc; }, {} as Record<string, unknown>);
}

// ── Join resolver
// Resolves "clients(name, phone)" by looking up client_id in the clients table
function resolveJoins(rows: Record<string, unknown>[], joins: JoinSpec[]): Record<string, unknown>[] {
  if (!joins.length) return rows;
  return rows.map((row) => {
    const resolved: Record<string, unknown> = { ...row };
    for (const join of joins) {
      // Try <singularAlias>_id as the FK
      const singular = join.alias.endsWith("s") ? join.alias.slice(0, -1) : join.alias;
      const fk = `${singular}_id`;
      const relId = row[fk];
      if (relId === undefined || relId === null) {
        resolved[join.alias] = null;
        continue;
      }
      const relTable = tables[join.alias] ?? tables[join.alias + "s"] ?? [];
      const relRow = relTable.find((r) => r["id"] === relId) as Record<string, unknown> | undefined;
      resolved[join.alias] = relRow ? pickCols(relRow, join.cols) : null;
    }
    return resolved;
  });
}

// ── Query builder
class QueryBuilder {
  private _table: string;
  private _filters: Filter[] = [];
  private _select = "*";
  private _orderKey = "";
  private _orderAsc = true;
  private _limit = Infinity;
  private _insertData: unknown = null;
  private _updateData: unknown = null;
  private _deleteFlag = false;

  constructor(tableName: string) {
    this._table = tableName;
  }

  select(sel: string) { this._select = sel; return this; }
  eq(col: string, val: unknown) { this._filters.push({ col, op: "eq", val }); return this; }
  neq(col: string, val: unknown) { this._filters.push({ col, op: "neq", val }); return this; }
  gt(col: string, val: unknown) { this._filters.push({ col, op: "gt", val }); return this; }
  gte(col: string, val: unknown) { this._filters.push({ col, op: "gte", val }); return this; }
  lt(col: string, val: unknown) { this._filters.push({ col, op: "lt", val }); return this; }
  lte(col: string, val: unknown) { this._filters.push({ col, op: "lte", val }); return this; }
  like(col: string, val: string) { this._filters.push({ col, op: "ilike", val }); return this; }
  ilike(col: string, val: string) { this._filters.push({ col, op: "ilike", val }); return this; }
  in(col: string, vals: unknown[]) { this._filters.push({ col, op: "in", val: vals }); return this; }
  is(col: string, val: unknown) { this._filters.push({ col, op: "is", val }); return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this._orderKey = col;
    this._orderAsc = opts?.ascending !== false;
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  range(_from: number, _to: number) { return this; }

  insert(data: unknown) { this._insertData = data; return this; }
  update(data: unknown) { this._updateData = data; return this; }
  delete() { this._deleteFlag = true; return this; }
  upsert(data: unknown) { this._insertData = data; return this; }

  async single(): Promise<QueryResult<Record<string, unknown> | null>> {
    const res = await this._run();
    const rows = (res as { data: Record<string, unknown>[] }).data;
    return ok(rows?.[0] ?? null);
  }

  async maybeSingle(): Promise<QueryResult<Record<string, unknown> | null>> {
    return this.single();
  }

  private _run(): Promise<QueryResult<Record<string, unknown>[]>> {
    const tableData = tables[this._table] ?? [];

    // ── INSERT
    if (this._insertData !== null) {
      const incoming = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
      const inserted = incoming.map((r: any) => ({
        id: r.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        created_at: r.created_at ?? new Date().toISOString(),
        ...r,
      }));
      tables[this._table] = [...tableData, ...inserted];
      return Promise.resolve(ok(inserted as Record<string, unknown>[]));
    }

    // ── UPDATE
    if (this._updateData !== null) {
      const updated: Record<string, unknown>[] = [];
      tables[this._table] = tableData.map((row) => {
        if (this._filters.every((f) => matchesFilter(row as Record<string, unknown>, f))) {
          const newRow = { ...(row as Record<string, unknown>), ...(this._updateData as Record<string, unknown>) };
          updated.push(newRow);
          return newRow;
        }
        return row;
      });
      return Promise.resolve(ok(updated));
    }

    // ── DELETE
    if (this._deleteFlag) {
      const deleted: Record<string, unknown>[] = [];
      tables[this._table] = tableData.filter((row) => {
        if (this._filters.every((f) => matchesFilter(row as Record<string, unknown>, f))) {
          deleted.push(row as Record<string, unknown>);
          return false;
        }
        return true;
      });
      return Promise.resolve(ok(deleted));
    }

    // ── SELECT
    let rows = tableData.filter((row) =>
      this._filters.every((f) => matchesFilter(row as Record<string, unknown>, f))
    ) as Record<string, unknown>[];

    // Sort
    if (this._orderKey) {
      const key = this._orderKey;
      const asc = this._orderAsc;
      rows = [...rows].sort((a, b) => {
        const av = String(a[key] ?? "");
        const bv = String(b[key] ?? "");
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }

    // Limit
    if (this._limit < Infinity) rows = rows.slice(0, this._limit);

    // Joins + column selection
    const { cols, joins } = parseSelect(this._select);
    rows = resolveJoins(rows, joins);

    if (cols.length && !(cols.length === 1 && cols[0] === "*")) {
      const joinAliases = joins.map((j) => j.alias);
      rows = rows.map((row) => {
        const picked = pickCols(row, cols);
        for (const alias of joinAliases) {
          picked[alias] = row[alias];
        }
        return picked;
      });
    }

    return Promise.resolve(ok(rows));
  }

  then(resolve: any, reject: any) { return this._run().then(resolve, reject); }
  catch(reject: any) { return this._run().catch(reject); }
  finally(handler: any) { return this._run().finally(handler); }
}

// ── Auth helpers
function getLocalSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown };
    const email = typeof parsed.email === "string" ? parsed.email : "local@barberhub.dev";
    return {
      access_token: "local-dev-token",
      refresh_token: "local-dev-refresh",
      expires_in: 60 * 60 * 24 * 365,
      token_type: "bearer",
      user: {
        id: "local-dev-user",
        email,
        app_metadata: {},
        user_metadata: { name: "João Silva" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
    };
  } catch {
    return null;
  }
}

function saveLocalSession(email: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify({ email, signedInAt: new Date().toISOString() }));
}

function clearLocalSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
}

// ── Public API
export const localData: any = {
  auth: {
    getSession: async () => ok({ session: getLocalSession() }),
    signInWithPassword: async ({ email }: { email: string }) => {
      saveLocalSession(email);
      return ok({ session: getLocalSession(), user: getLocalSession()?.user ?? null });
    },
    signUp: async ({ email }: { email: string }) => {
      saveLocalSession(email);
      return ok({ session: getLocalSession(), user: getLocalSession()?.user ?? null });
    },
    signOut: async () => { clearLocalSession(); return ok(null); },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: async () => ok({}),
    updateUser: async () => ok({ user: getLocalSession()?.user ?? null }),
    resend: async () => ok({}),
  },
  from: (tableName: string) => new QueryBuilder(tableName),
  rpc: (_fn: string, _args?: unknown) => new QueryBuilder("__rpc__"),
  storage: {
    from: () => ({
      upload: async () => ok({ path: "" }),
      remove: async () => ok([]),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
};
