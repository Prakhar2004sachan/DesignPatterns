// Abstract Products
interface Connection {
  connect: () => void;
  close: () => void;
}

interface Command {
  execute: (sql: String) => void;
  prepare: (sql: String) => void;
}

// Abstract Factory
interface DBFactory {
  createConnection(): Connection;
  createCommand(): Command;
}

// Concrete Product : Postgres
class PostgresConnection implements Connection {
  connect(): void {
    console.log("Postgress sql : Connection established");
  }
  close(): void {
    console.log("Postgres Connection Closed!");
  }
}

class PostgresCommand implements Command {
  execute(sql: String): void {
    console.log(`Execute Query : ${sql}`);
  }
  prepare(sql: String): void {
    console.log(`Prepare Query ; ${sql}`);
  }
}

// Concrete Product : MySQL
class MySQLConnection implements Connection {
  connect(): void {
    console.log("MySQL : Connection established");
  }
  close(): void {
    console.log("MySQL Connection Closed!");
  }
}

class MySQLCommand implements Command {
  execute(sql: String): void {
    console.log(`Execute Query : ${sql}`);
  }
  prepare(sql: String): void {
    console.log(`Prepare Query ; ${sql}`);
  }
}

// Concrete Factory : Postgress
class PostgresDBFactory implements DBFactory {
  createConnection(): Connection {
    return new PostgresConnection();
  }
  createCommand(): Command {
    return new PostgresCommand();
  }
}

// Concrete Factory : MySQL
class MySQLDBFactory implements DBFactory {
  createConnection(): Connection {
    return new MySQLConnection();
  }
  createCommand(): Command {
    return new MySQLCommand();
  }
}

// Client
function runQuery(factory: DBFactory): void {
  const conn = factory.createConnection();
  const cmd = factory.createCommand();
  conn.connect();
  cmd.execute("Select * From table");
  cmd.prepare("Select * From table");
  conn.close();
}

function main(): void {
  const db = "postgress";

  let factory: DBFactory;
  if (db == "postgress") {
    factory = new PostgresDBFactory();
  } else {
    factory = new MySQLDBFactory();
  }
  runQuery(factory);
}

main();
