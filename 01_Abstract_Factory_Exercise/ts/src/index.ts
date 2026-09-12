import pg from "pg";
import mysql from "mysql2/promise";
import { DatabaseSync } from "node:sqlite";

// ==========================================
// 1. Abstract Products
// ==========================================

export interface Connection {
  connect(): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
}

export interface Command {
  prepare(sql: string): Promise<void>;
  execute<T = any>(sql?: string): Promise<T[] | any>;
}

// ==========================================
// 2. Abstract Factory
// ==========================================

export interface DatabaseFactory {
  createConnection(): Connection;
  createCommand(connection?: Connection): Command;
}

// ==========================================
// 3. Concrete Product Family 1: PostgreSQL
// ==========================================

export class PostgresConnection implements Connection {
  private client: pg.Client;
  private connected = false;

  constructor(config?: pg.ClientConfig) {
    this.client = new pg.Client(
      config || {
        host: process.env.PG_HOST || "localhost",
        port: Number(process.env.PG_PORT) || 5432,
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD || "postgres",
        database: process.env.PG_DATABASE || "postgres",
      },
    );
  }

  getNativeClient(): pg.Client {
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    try {
      console.log("[Postgres] Connecting to PostgreSQL database...");
      await this.client.connect();
      this.connected = true;
      console.log("[Postgres] Connection established successfully!");
    } catch (err: any) {
      console.warn(
        `[Postgres] Live server connection unavailable (${err.code || err.message}).`,
      );
      console.warn(
        "[Postgres] Operating in mock-fallback mode (start Postgres on port 5432 for live DB).",
      );
      this.connected = true;
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      try {
        await this.client.end();
      } catch {}
      this.connected = false;
      console.log("[Postgres] Connection closed.");
    }
  }
}

export class PostgresCommand implements Command {
  private connection: PostgresConnection;
  private preparedSql: string | null = null;

  constructor(connection: PostgresConnection) {
    this.connection = connection;
  }

  async prepare(sql: string): Promise<void> {
    if (!this.connection.isConnected()) {
      throw new Error(
        "[PostgresCommand] Cannot prepare statement without an active connection.",
      );
    }
    this.preparedSql = sql;
    console.log(`[Postgres] Statement prepared: "${sql}"`);
  }

  async execute<T = any>(sql?: string): Promise<T[] | any> {
    if (!this.connection.isConnected()) {
      throw new Error(
        "[PostgresCommand] Cannot execute query on a closed connection.",
      );
    }

    const queryToRun = sql || this.preparedSql;
    if (!queryToRun) {
      throw new Error(
        "[PostgresCommand] No SQL statement provided to execute.",
      );
    }

    console.log(`[Postgres] Executing query: "${queryToRun}"`);
    try {
      const res = await this.connection.getNativeClient().query(queryToRun);
      console.log(
        `[Postgres] Query executed. Rows affected/returned: ${res.rowCount ?? 0}`,
      );
      return res.rows;
    } catch {
      // Fallback demonstration if database server is offline
      return [{ id: 1, engine: "PostgreSQL", status: "Executed in mock mode" }];
    }
  }
}

export class PostgresDBFactory implements DatabaseFactory {
  private activeConnection: PostgresConnection | null = null;

  createConnection(): PostgresConnection {
    const conn = new PostgresConnection();
    this.activeConnection = conn;
    return conn;
  }

  createCommand(connection?: Connection): PostgresCommand {
    const target = (connection as PostgresConnection) || this.activeConnection;
    if (!target) {
      throw new Error(
        "[PostgresDBFactory] No connection available to create Command.",
      );
    }
    return new PostgresCommand(target);
  }
}

// ==========================================
// 4. Concrete Product Family 2: MySQL
// ==========================================

export class MySQLConnection implements Connection {
  private conn: mysql.Connection | null = null;
  private connected = false;
  private config?: mysql.ConnectionOptions;

  constructor(config?: mysql.ConnectionOptions) {
    this.config = config;
  }

  getNativeConnection(): mysql.Connection | null {
    return this.conn;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    try {
      console.log("[MySQL] Connecting to MySQL database...");
      this.conn = await mysql.createConnection(
        this.config || {
          host: process.env.MYSQL_HOST || "localhost",
          port: Number(process.env.MYSQL_PORT) || 3306,
          user: process.env.MYSQL_USER || "root",
          password: process.env.MYSQL_PASSWORD || "root",
          database: process.env.MYSQL_DATABASE || "test",
        },
      );
      this.connected = true;
      console.log("[MySQL] Connection established successfully!");
    } catch (err: any) {
      console.warn(
        `[MySQL] Live server connection unavailable (${err.code || err.message}).`,
      );
      console.warn(
        "[MySQL] Operating in mock-fallback mode (start MySQL on port 3306 for live DB).",
      );
      this.connected = true;
    }
  }

  async close(): Promise<void> {
    if (this.conn && this.connected) {
      try {
        await this.conn.end();
      } catch {}
      this.connected = false;
      console.log("[MySQL] Connection closed.");
    }
  }
}

export class MySQLCommand implements Command {
  private connection: MySQLConnection;
  private preparedSql: string | null = null;

  constructor(connection: MySQLConnection) {
    this.connection = connection;
  }

  async prepare(sql: string): Promise<void> {
    if (!this.connection.isConnected()) {
      throw new Error(
        "[MySQLCommand] Cannot prepare statement without an active connection.",
      );
    }
    this.preparedSql = sql;
    console.log(`[MySQL] Statement prepared: "${sql}"`);
  }

  async execute<T = any>(sql?: string): Promise<T[] | any> {
    if (!this.connection.isConnected()) {
      throw new Error(
        "[MySQLCommand] Cannot execute query on a closed connection.",
      );
    }

    const queryToRun = sql || this.preparedSql;
    if (!queryToRun) {
      throw new Error("[MySQLCommand] No SQL statement provided to execute.");
    }

    console.log(`[MySQL] Executing query: "${queryToRun}"`);
    const native = this.connection.getNativeConnection();
    if (native) {
      try {
        const [rows] = await native.query(queryToRun);
        return rows;
      } catch (err: any) {
        console.warn(`[MySQL] Driver query warning: ${err.message}`);
      }
    }
    return [{ id: 101, engine: "MySQL", status: "Executed in mock mode" }];
  }
}

export class MySQLDBFactory implements DatabaseFactory {
  private activeConnection: MySQLConnection | null = null;

  createConnection(): MySQLConnection {
    const conn = new MySQLConnection();
    this.activeConnection = conn;
    return conn;
  }

  createCommand(connection?: Connection): MySQLCommand {
    const target = (connection as MySQLConnection) || this.activeConnection;
    if (!target) {
      throw new Error(
        "[MySQLDBFactory] No connection available to create Command.",
      );
    }
    return new MySQLCommand(target);
  }
}

// ==========================================
// 5. Concrete Product Family 3: SQLite (Zero-Config Embedded Engine)
// Demonstrates Section 7 from README: extending with SQLite without touching existing code!
// ==========================================

export class SQLiteConnection implements Connection {
  private db: DatabaseSync | null = null;
  private connected = false;
  private path: string;

  constructor(path: string = "exercise.db") {
    this.path = path;
  }

  getNativeDb(): DatabaseSync {
    if (!this.db) throw new Error("[SQLite] Database is not connected.");
    return this.db;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    console.log(`[SQLite] Opening database at "${this.path}"...`);
    this.db = new DatabaseSync(this.path);
    this.connected = true;
    console.log("[SQLite] Connection established successfully.");
  }

  async close(): Promise<void> {
    if (this.db && this.connected) {
      this.db.close();
      this.connected = false;
      console.log("[SQLite] Connection closed.");
    }
  }
}

export class SQLiteCommand implements Command {
  private connection: SQLiteConnection;
  private preparedSql: string | null = null;

  constructor(connection: SQLiteConnection) {
    this.connection = connection;
  }

  async prepare(sql: string): Promise<void> {
    if (!this.connection.isConnected()) {
      throw new Error(
        "[SQLiteCommand] Cannot prepare statement on closed connection.",
      );
    }
    this.preparedSql = sql;
    // Validate SQL syntax via SQLite statement preparation
    this.connection.getNativeDb().prepare(sql);
    console.log(`[SQLite] Statement prepared & validated: "${sql}"`);
  }

  async execute<T = any>(sql?: string): Promise<T[] | any> {
    if (!this.connection.isConnected()) {
      throw new Error(
        "[SQLiteCommand] Cannot execute query on a closed connection.",
      );
    }

    const queryToRun = sql || this.preparedSql;
    if (!queryToRun) {
      throw new Error("[SQLiteCommand] No SQL statement provided to execute.");
    }

    console.log(`[SQLite] Executing query: "${queryToRun}"`);
    const db = this.connection.getNativeDb();

    const trimmed = queryToRun.trim().toUpperCase();
    if (trimmed.startsWith("SELECT") || trimmed.startsWith("PRAGMA")) {
      const stmt = db.prepare(queryToRun);
      const rows = stmt.all();
      console.log(`[SQLite] Query completed. ${rows.length} rows returned.`);
      return rows;
    } else {
      db.exec(queryToRun);
      console.log("[SQLite] Statement executed successfully.");
      return { success: true };
    }
  }
}

export class SQLiteDBFactory implements DatabaseFactory {
  private activeConnection: SQLiteConnection | null = null;
  private path: string;

  constructor(path: string = "exercise.db") {
    this.path = path;
  }

  createConnection(): SQLiteConnection {
    const conn = new SQLiteConnection(this.path);
    this.activeConnection = conn;
    return conn;
  }

  createCommand(connection?: Connection): SQLiteCommand {
    const target = (connection as SQLiteConnection) || this.activeConnection;
    if (!target) {
      throw new Error(
        "[SQLiteDBFactory] No connection available to create Command.",
      );
    }
    return new SQLiteCommand(target);
  }
}

// ==========================================
// 6. Client Code
// Strictly uses abstract interfaces: zero references to Postgres, MySQL, or SQLite!
// ==========================================

async function runQuery(factory: DatabaseFactory, sql: string): Promise<void> {
  const conn = factory.createConnection();
  const cmd = factory.createCommand(conn);

  await conn.connect();
  try {
    await cmd.prepare(sql);
    const result = await cmd.execute(sql);
    console.log("Query Result:", result);
  } finally {
    await conn.close();
  }
}

// ==========================================
// 7. Composition Root (main)
// ==========================================

async function main(): Promise<void> {
  console.log("=== [TypeScript] 01_Abstract_Factory_Exercise ===\n");

  // Choose database via DB environment variable: "postgres", "mysql", or "sqlite"
  const dbChoice = process.env.DB || "sqlite";

  let factory: DatabaseFactory;
  switch (dbChoice) {
    case "postgres":
      factory = new PostgresDBFactory();
      break;
    case "mysql":
      factory = new MySQLDBFactory();
      break;
    case "sqlite":
    default:
      factory = new SQLiteDBFactory();
      break;
  }

  console.log(`Selected Database: ${dbChoice.toUpperCase()}\n`);

  if (dbChoice === "sqlite") {
    // Demonstrate real DDL & query on live SQLite
    const setupConn = factory.createConnection();
    const setupCmd = factory.createCommand(setupConn);
    await setupConn.connect();
    await setupCmd.execute(
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);",
    );
    await setupCmd.execute(
      "INSERT OR REPLACE INTO users VALUES (1, 'Prakhar Sachan', 'prakhar@example.com');",
    );
    await setupCmd.execute(
      "INSERT OR REPLACE INTO users VALUES (2, 'Alice Smith', 'alice@example.com');",
    );
    await setupConn.close();
    console.log("");
  }

  // Run query via the vendor-agnostic client function
  await runQuery(factory, "SELECT * FROM users");
}

main().catch(console.error);
