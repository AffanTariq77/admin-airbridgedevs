const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { initAdminDb } = require("./db");
const { ensureDefaultAdmin, login, signToken } = require("./services/auth");
const { loadRepos, getRepoById, configPath } = require("./services/repoRegistry");
const {
  listSubmissions,
  getSubmission,
  createSubmission,
  deleteSubmission,
  countSubmissions,
  upsertSubmissionMeta,
} = require("./services/submissions");
const { requireAuth, requireRole } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(bodyParser.json());

const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    const user = await login(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = signToken(user);
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ id: req.user.sub, email: req.user.email, role: req.user.role });
});

app.get("/api/repos", requireAuth, async (req, res) => {
  try {
    const repos = loadRepos();
    const withCounts = await Promise.all(
      repos.map(async (repo) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description || "",
        submissionCount: await countSubmissions(repo),
      }))
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ error: "Failed to load repos" });
  }
});

app.get("/api/repos/:repoId/submissions", requireAuth, async (req, res) => {
  const repo = getRepoById(req.params.repoId);
  if (!repo) {
    return res.status(404).json({ error: "Repository not found" });
  }
  try {
    const submissions = await listSubmissions(repo);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

app.get("/api/repos/:repoId/submissions/:id", requireAuth, async (req, res) => {
  const repo = getRepoById(req.params.repoId);
  if (!repo) {
    return res.status(404).json({ error: "Repository not found" });
  }
  try {
    const submission = await getSubmission(repo, Number(req.params.id));
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: "Failed to load submission" });
  }
});

app.post(
  "/api/repos/:repoId/submissions",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const repo = getRepoById(req.params.repoId);
    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }
    const { name, email, company, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    try {
      const result = await createSubmission(repo, { name, email, company, message });
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to create submission" });
    }
  }
);

app.patch(
  "/api/repos/:repoId/submissions/:id",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const repo = getRepoById(req.params.repoId);
    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }
    const { status, notes } = req.body || {};
    try {
      await upsertSubmissionMeta(repo.id, Number(req.params.id), status || "new", notes || "");
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update submission" });
    }
  }
);

app.delete(
  "/api/repos/:repoId/submissions/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    const repo = getRepoById(req.params.repoId);
    if (!repo) {
      return res.status(404).json({ error: "Repository not found" });
    }
    try {
      await deleteSubmission(repo, Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete submission" });
    }
  }
);

app.get("/api/config", requireAuth, (req, res) => {
  res.json({ configPath });
});

app.get("*", (req, res) => {
  if (fs.existsSync(distPath)) {
    return res.sendFile(path.join(distPath, "index.html"));
  }
  return res.status(404).send("Not found");
});

initAdminDb(process.env.ADMIN_DB_PATH || path.join(__dirname, "../data/admin.db"))
  .then(() => ensureDefaultAdmin())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Admin server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start admin server:", err.message);
    process.exit(1);
  });
