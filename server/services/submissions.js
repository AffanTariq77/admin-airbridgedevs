const fs = require("fs");
const path = require("path");
const { openDb, all, get, run, getAdminDb } = require("../db");

function resolveDbPath(repo) {
  return path.resolve(repo.dbPath);
}

async function withRepoDb(repo, handler, emptyValue) {
  const dbPath = resolveDbPath(repo);
  if (!fs.existsSync(dbPath)) {
    return emptyValue;
  }
  const db = openDb(dbPath);
  try {
    return await handler(db);
  } finally {
    db.close();
  }
}

async function getMetaMap(repoId) {
  const adminDb = getAdminDb();
  const rows = await all(adminDb, "SELECT submission_id, status, notes FROM submission_meta WHERE repo_id = ?", [
    repoId,
  ]);
  const map = new Map();
  rows.forEach((row) => {
    map.set(row.submission_id, { status: row.status, notes: row.notes });
  });
  return map;
}

async function listSubmissions(repo) {
  const rows = await withRepoDb(
    repo,
    (db) =>
      all(
        db,
        "SELECT id, name, email, company, message, timestamp FROM submissions ORDER BY timestamp DESC"
      ),
    []
  );

  const metaMap = await getMetaMap(repo.id);
  return rows.map((row) => ({
    ...row,
    status: metaMap.get(row.id)?.status ?? "new",
    notes: metaMap.get(row.id)?.notes ?? "",
  }));
}

async function getSubmission(repo, submissionId) {
  const row = await withRepoDb(
    repo,
    (db) =>
      get(
        db,
        "SELECT id, name, email, company, message, timestamp FROM submissions WHERE id = ?",
        [submissionId]
      ),
    null
  );
  if (!row) return null;
  const metaMap = await getMetaMap(repo.id);
  return {
    ...row,
    status: metaMap.get(row.id)?.status ?? "new",
    notes: metaMap.get(row.id)?.notes ?? "",
  };
}

async function createSubmission(repo, payload) {
  return withRepoDb(
    repo,
    async (db) => {
      const result = await run(
        db,
        "INSERT INTO submissions (name, email, company, message) VALUES (?, ?, ?, ?)",
        [payload.name, payload.email, payload.company || "", payload.message]
      );
      return { id: result.lastID };
    },
    null
  );
}

async function deleteSubmission(repo, submissionId) {
  return withRepoDb(
    repo,
    async (db) => {
      await run(db, "DELETE FROM submissions WHERE id = ?", [submissionId]);
      return true;
    },
    false
  );
}

async function countSubmissions(repo) {
  return withRepoDb(
    repo,
    async (db) => {
      const row = await get(db, "SELECT COUNT(*) as count FROM submissions");
      return row?.count || 0;
    },
    0
  );
}

async function upsertSubmissionMeta(repoId, submissionId, status, notes) {
  const adminDb = getAdminDb();
  await run(
    adminDb,
    `INSERT INTO submission_meta (repo_id, submission_id, status, notes, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(repo_id, submission_id) DO UPDATE SET status = excluded.status, notes = excluded.notes, updated_at = CURRENT_TIMESTAMP`,
    [repoId, submissionId, status, notes]
  );
}

module.exports = {
  listSubmissions,
  getSubmission,
  createSubmission,
  deleteSubmission,
  countSubmissions,
  upsertSubmissionMeta,
};
