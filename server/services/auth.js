const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getAdminDb, get, run } = require("../db");

const jwtSecret = process.env.JWT_SECRET || "";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "8h";

async function ensureDefaultAdmin() {
  const db = getAdminDb();
  const row = await get(db, "SELECT COUNT(*) as count FROM users");
  if (row?.count > 0) {
    return;
  }

  const email = process.env.ADMIN_DEFAULT_EMAIL;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD for initial admin user.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await run(db, "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)", [
    email,
    passwordHash,
    "admin",
  ]);
}

async function login(email, password) {
  const db = getAdminDb();
  const user = await get(db, "SELECT * FROM users WHERE email = ?", [email]);
  if (!user) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return null;
  }
  return user;
}

function signToken(user) {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required.");
  }
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

function verifyToken(token) {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required.");
  }
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  ensureDefaultAdmin,
  login,
  signToken,
  verifyToken,
};
