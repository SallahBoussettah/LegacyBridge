import mysql from "mysql2/promise";
import { Client } from "pg";

/**
 * Database Schema Inspector Service
 * Discovers and analyzes database schemas for MySQL and PostgreSQL
 */
class DatabaseInspector {
  /**
   * Create database connection based on type
   */
  async createConnection(connectionConfig) {
    const { type, host, port, databaseName, username, password, sslEnabled } =
      connectionConfig;

    try {
      if (type === "mysql") {
        return await mysql.createConnection({
          host,
          port: parseInt(port),
          user: username,
          password,
          database: databaseName,
          ssl: sslEnabled ? {} : false,
          connectTimeout: 10000,
          acquireTimeout: 10000,
        });
      } else if (type === "postgresql") {
        const client = new Client({
          host,
          port: parseInt(port),
          user: username,
          password,
          database: databaseName,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 10000,
        });
        await client.connect();
        return client;
      } else {
        throw new Error(`Unsupported database type: ${type}`);
      }
    } catch (error) {
      console.error("Database connection error:", error);
      throw new Error(
        `Failed to connect to ${type} database: ${error.message}`
      );
    }
  }

  /**
   * Test database connection
   */
  async testConnection(connectionConfig) {
    let connection = null;
    try {
      connection = await this.createConnection(connectionConfig);

      if (connectionConfig.type === "mysql") {
        await connection.execute("SELECT 1");
      } else if (connectionConfig.type === "postgresql") {
        await connection.query("SELECT 1");
      }

      return {
        success: true,
        message: "Connection successful",
        serverInfo: await this.getServerInfo(connection, connectionConfig.type),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    } finally {
      if (connection) {
        if (connectionConfig.type === "mysql") {
          await connection.end();
        } else if (connectionConfig.type === "postgresql") {
          await connection.end();
        }
      }
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(connection, type) {
    try {
      if (type === "mysql") {
        const [rows] = await connection.execute("SELECT VERSION() as version");
        return {
          version: rows[0].version,
          type: "MySQL",
        };
      } else if (type === "postgresql") {
        const result = await connection.query("SELECT version()");
        return {
          version: result.rows[0].version,
          type: "PostgreSQL",
        };
      }
    } catch (error) {
      return {
        version: "Unknown",
        type: type === "mysql" ? "MySQL" : "PostgreSQL",
      };
    }
  }

  /**
   * Discover database schema
   */
  async discoverSchema(connectionConfig) {
    let connection = null;
    try {
      connection = await this.createConnection(connectionConfig);

      const tables = await this.getTables(connection, connectionConfig);
      const schema = {
        database: connectionConfig.databaseName,
        type: connectionConfig.type,
        tables: [],
      };

      for (const table of tables) {
        const tableInfo = {
          name: table.name,
          rowCount: table.rowCount,
          columns: await this.getColumns(
            connection,
            connectionConfig,
            table.name
          ),
          indexes: await this.getIndexes(
            connection,
            connectionConfig,
            table.name
          ),
          foreignKeys: await this.getForeignKeys(
            connection,
            connectionConfig,
            table.name
          ),
        };
        schema.tables.push(tableInfo);
      }

      return {
        success: true,
        data: schema,
      };
    } catch (error) {
      console.error("Schema discovery error:", error);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      if (connection) {
        if (connectionConfig.type === "mysql") {
          await connection.end();
        } else if (connectionConfig.type === "postgresql") {
          await connection.end();
        }
      }
    }
  }

  /**
   * Get all tables in database
   */
  async getTables(connection, config) {
    if (config.type === "mysql") {
      const [rows] = await connection.execute(
        `
        SELECT 
          TABLE_NAME as name,
          TABLE_ROWS as rowCount
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `,
        [config.databaseName]
      );
      return rows;
    } else if (config.type === "postgresql") {
      const result = await connection.query(`
        SELECT 
          tablename as name,
          schemaname,
          (SELECT reltuples::bigint FROM pg_class WHERE relname = tablename) as rowCount
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);
      return result.rows;
    }
  }

  /**
   * Get columns for a table
   */
  async getColumns(connection, config, tableName) {
    if (config.type === "mysql") {
      const [rows] = await connection.execute(
        `
        SELECT 
          COLUMN_NAME as name,
          DATA_TYPE as type,
          IS_NULLABLE as nullable,
          COLUMN_DEFAULT as defaultValue,
          COLUMN_KEY as key,
          EXTRA as extra,
          CHARACTER_MAXIMUM_LENGTH as maxLength
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `,
        [config.databaseName, tableName]
      );

      return rows.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable === "YES",
        defaultValue: col.defaultValue,
        isPrimaryKey: col.key === "PRI",
        isAutoIncrement: col.extra.includes("auto_increment"),
        maxLength: col.maxLength,
      }));
    } else if (config.type === "postgresql") {
      const result = await connection.query(
        `
        SELECT 
          column_name as name,
          data_type as type,
          is_nullable as nullable,
          column_default as defaultValue,
          character_maximum_length as maxLength
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
        [tableName]
      );

      return result.rows.map((col) => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable === "YES",
        defaultValue: col.defaultvalue,
        isPrimaryKey: false, // Will be set by primary key query
        isAutoIncrement:
          col.defaultvalue && col.defaultvalue.includes("nextval"),
        maxLength: col.maxlength,
      }));
    }
  }

  /**
   * Get indexes for a table
   */
  async getIndexes(connection, config, tableName) {
    if (config.type === "mysql") {
      const [rows] = await connection.execute(
        `
        SELECT 
          INDEX_NAME as name,
          COLUMN_NAME as columnName,
          NON_UNIQUE as nonUnique,
          INDEX_TYPE as type
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `,
        [config.databaseName, tableName]
      );

      return rows.map((idx) => ({
        name: idx.name,
        columnName: idx.columnName,
        isUnique: idx.nonUnique === 0,
        type: idx.type,
      }));
    } else if (config.type === "postgresql") {
      const result = await connection.query(
        `
        SELECT 
          i.relname as name,
          a.attname as columnName,
          ix.indisunique as isUnique,
          am.amname as type
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        JOIN pg_am am ON i.relam = am.oid
        WHERE t.relname = $1
        ORDER BY i.relname
      `,
        [tableName]
      );

      return result.rows.map((idx) => ({
        name: idx.name,
        columnName: idx.columnname,
        isUnique: idx.isunique,
        type: idx.type,
      }));
    }
  }

  /**
   * Get foreign keys for a table
   */
  async getForeignKeys(connection, config, tableName) {
    if (config.type === "mysql") {
      const [rows] = await connection.execute(
        `
        SELECT 
          CONSTRAINT_NAME as name,
          COLUMN_NAME as columnName,
          REFERENCED_TABLE_NAME as referencedTable,
          REFERENCED_COLUMN_NAME as referencedColumn
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
        [config.databaseName, tableName]
      );

      return rows.map((fk) => ({
        name: fk.name,
        columnName: fk.columnName,
        referencedTable: fk.referencedTable,
        referencedColumn: fk.referencedColumn,
      }));
    } else if (config.type === "postgresql") {
      const result = await connection.query(
        `
        SELECT 
          tc.constraint_name as name,
          kcu.column_name as columnName,
          ccu.table_name as referencedTable,
          ccu.column_name as referencedColumn
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = $1
      `,
        [tableName]
      );

      return result.rows.map((fk) => ({
        name: fk.name,
        columnName: fk.columnname,
        referencedTable: fk.referencedtable,
        referencedColumn: fk.referencedcolumn,
      }));
    }
  }

  /**
   * Execute query against database
   */
  async executeQuery(connectionConfig, query, parameters = []) {
    let connection = null;
    try {
      connection = await this.createConnection(connectionConfig);

      const startTime = Date.now();
      let result;

      if (connectionConfig.type === "mysql") {
        const [rows] = await connection.execute(query, parameters);
        result = {
          rows: rows,
          rowCount: rows.length,
          executionTime: Date.now() - startTime,
        };
      } else if (connectionConfig.type === "postgresql") {
        const queryResult = await connection.query(query, parameters);
        result = {
          rows: queryResult.rows,
          rowCount: queryResult.rowCount,
          executionTime: Date.now() - startTime,
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Query execution error:", error);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      if (connection) {
        if (connectionConfig.type === "mysql") {
          await connection.end();
        } else if (connectionConfig.type === "postgresql") {
          await connection.end();
        }
      }
    }
  }
}

export default new DatabaseInspector();
