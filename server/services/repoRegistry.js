const fs = require("fs");
const path = require("path");

const configPath = process.env.REPOS_CONFIG_PATH
  ? path.resolve(process.env.REPOS_CONFIG_PATH)
  : path.resolve(__dirname, "../../config/repos.json");

function loadRepos() {
  if (!fs.existsSync(configPath)) {
    return [];
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
}

function getRepoById(repoId) {
  return loadRepos().find((repo) => repo.id === repoId);
}

module.exports = {
  loadRepos,
  getRepoById,
  configPath,
};
