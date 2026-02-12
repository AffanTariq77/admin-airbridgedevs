const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

let adminDb;

function openDb(dbPath) {
  return new sqlite3.Database(dbPath);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function initAdminDb(dbPath) {
  const resolvedPath = path.resolve(dbPath);
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  adminDb = openDb(resolvedPath);

  await run(
    adminDb,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    adminDb,
    `CREATE TABLE IF NOT EXISTS submission_meta (
      repo_id TEXT NOT NULL,
      submission_id INTEGER NOT NULL,
      status TEXT DEFAULT 'new',
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (repo_id, submission_id)
    )`
  );

  return adminDb;
}

function getAdminDb() {
  if (!adminDb) {
    throw new Error("Admin DB not initialized");
  }
  return adminDb;
}

module.exports = {
  openDb,
  run,
  get,
  all,
  initAdminDb,
  getAdminDb,
};
