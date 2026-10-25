"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDb = getDb;
exports.saveDatabase = saveDatabase;
exports.queryAll = queryAll;
exports.queryOne = queryOne;
exports.execute = execute;
const sql_js_1 = __importDefault(require("sql.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let SQL;
let db;
const DB_DIR = path_1.default.resolve(process.cwd(), 'data');
const DB_FILE = path_1.default.join(DB_DIR, 'campus_network.sqlite');
async function initDatabase() {
    if (db)
        return db;
    if (!fs_1.default.existsSync(DB_DIR)) {
        fs_1.default.mkdirSync(DB_DIR, { recursive: true });
    }
    SQL = await (0, sql_js_1.default)();
    if (fs_1.default.existsSync(DB_FILE)) {
        try {
            const fileBuffer = fs_1.default.readFileSync(DB_FILE);
            db = new SQL.Database(fileBuffer);
            console.log('Loaded existing SQLite database from', DB_FILE);
        }
        catch (err) {
            console.warn('Failed reading existing DB file, creating fresh DB:', err);
            db = new SQL.Database();
        }
    }
    else {
        db = new SQL.Database();
        console.log('Created new in-memory SQLite database');
    }
    createSchema();
    saveDatabase();
    return db;
}
function getDb() {
    if (!db) {
        throw new Error('Database not initialized! Call initDatabase() first.');
    }
    return db;
}
function saveDatabase() {
    if (!db)
        return;
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs_1.default.writeFileSync(DB_FILE, buffer);
    }
    catch (err) {
        console.error('Error saving SQLite database to disk:', err);
    }
}
function createSchema() {
    db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      department TEXT,
      role TEXT NOT NULL,
      ip_address TEXT,
      mac_address TEXT,
      vlan_id INTEGER,
      status TEXT NOT NULL,
      interfaces_json TEXT NOT NULL,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      source_device_id TEXT NOT NULL,
      source_interface_id TEXT,
      target_device_id TEXT NOT NULL,
      target_interface_id TEXT,
      bandwidth_mbps REAL NOT NULL,
      latency_ms REAL NOT NULL,
      status TEXT NOT NULL,
      packet_loss_rate REAL NOT NULL,
      cost REAL,
      is_redundant INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS vlans (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      ipv4_subnet TEXT NOT NULL,
      ipv4_gateway TEXT NOT NULL,
      ipv6_subnet TEXT NOT NULL,
      ipv6_gateway TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS acl_rules (
      id TEXT PRIMARY KEY,
      priority INTEGER NOT NULL,
      description TEXT NOT NULL,
      source_subnet TEXT NOT NULL,
      dest_subnet TEXT NOT NULL,
      protocol TEXT NOT NULL,
      source_port TEXT,
      dest_port TEXT,
      action TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      hit_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      aim TEXT NOT NULL,
      theory TEXT NOT NULL,
      requirements_json TEXT NOT NULL,
      procedure_json TEXT NOT NULL,
      configuration_json TEXT NOT NULL,
      observations_json TEXT NOT NULL,
      results_json TEXT NOT NULL,
      conclusion TEXT NOT NULL,
      viva_questions_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      last_run_timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS simulation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      category TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      details_json TEXT
    );
  `);
}
function queryAll(sql, params = []) {
    const database = getDb();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
}
function execute(sql, params = []) {
    const database = getDb();
    database.run(sql, params);
    saveDatabase();
}
