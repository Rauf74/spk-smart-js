// server/config/db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const hasConnectionString = Boolean(process.env.DATABASE_URL);
const shouldUseSSL = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

const poolConfig = hasConnectionString
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "spk-smart-js",
      ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined,
    };

const pool = new Pool(poolConfig);

const convertPlaceholders = (query = "") => {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
};

const extractInsertId = (rows = []) => {
  if (!rows.length) return null;
  if ("id" in rows[0]) return rows[0].id;
  const key = Object.keys(rows[0]).find((k) => k.endsWith("_id"));
  return key ? rows[0][key] : null;
};

const shouldReturnRows = (text = "") => /\bRETURNING\b/i.test(text);

async function query(sql, params = []) {
  const text = convertPlaceholders(sql);
  const values = Array.isArray(params) ? params : [];
  const result = await pool.query(text, values);

  if (result.command === "SELECT" || shouldReturnRows(text)) {
    return [result.rows];
  }

  return [
    {
      affectedRows: result.rowCount ?? 0,
      rowCount: result.rowCount ?? 0,
      insertId:
        result.command === "INSERT" ? extractInsertId(result.rows) : null,
    },
  ];
}

async function getConnection() {
  const client = await pool.connect();

  return {
    async beginTransaction() {
      await client.query("BEGIN");
    },
    async commit() {
      await client.query("COMMIT");
    },
    async rollback() {
      await client.query("ROLLBACK");
    },
    async query(sql, params = []) {
      const text = convertPlaceholders(sql);
      const result = await client.query(text, params);

      if (result.command === "SELECT" || shouldReturnRows(text)) {
        return [result.rows];
      }

      return [
        {
          affectedRows: result.rowCount ?? 0,
          rowCount: result.rowCount ?? 0,
          insertId:
            result.command === "INSERT" ? extractInsertId(result.rows) : null,
        },
      ];
    },
    release() {
      client.release();
    },
  };
}

const db = {
  query,
  pool,
  getConnection,
};

export default db;
export { query, pool, getConnection };
