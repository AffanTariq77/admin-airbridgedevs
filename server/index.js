// Upload API for the admin panel.
//
// The admin panel is a browser app and cannot write to disk, so image uploads
// go through this small server. Files land in a plain "uploads" folder that the
// public website serves, and only the relative path (/uploads/<file>) is stored
// in Supabase.
//
// Local default: writes into airbridge-replica-project/public/uploads, so the
// files are immediately reachable at http://localhost:8080/uploads/<file>.
// On a server, set UPLOAD_DIR to the uploads folder inside the deployed site
// and make sure that folder is writable.

const fs = require("fs");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

const PORT = process.env.PORT || 5050;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, matches the client-side check

// Where the files are written. Override with UPLOAD_DIR in production.
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  path.resolve(__dirname, "../../airbridge-replica-project/public/uploads");

// Public path prefix the site serves the folder under.
const PUBLIC_PREFIX = process.env.UPLOAD_PUBLIC_PREFIX || "/uploads";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Keep something recognisable from the original name, drop everything unsafe
function safeFilename(originalName) {
  const extension = (path.extname(originalName) || ".png").toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const unique = crypto.randomUUID().slice(0, 8);
  return `${base || "image"}-${unique}${extension || ".png"}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
  }),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error(`"${file.originalname}" is not an image`));
      return;
    }
    cb(null, true);
  },
});

const app = express();
app.use(cors());

// Serve the folder so the admin panel can preview what it just uploaded
app.use(PUBLIC_PREFIX, express.static(UPLOAD_DIR));

app.get("/api/uploads/health", (_req, res) => {
  res.json({ ok: true, uploadDir: UPLOAD_DIR, publicPrefix: PUBLIC_PREFIX });
});

app.post("/api/uploads", (req, res) => {
  upload.array("files", 20)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Image is larger than 5 MB" : err.message || "Upload failed";
      res.status(400).json({ error: message });
      return;
    }

    const files = req.files || [];

    if (!files.length) {
      res.status(400).json({ error: "No files received" });
      return;
    }

    res.json({
      files: files.map((file) => ({
        name: file.originalname,
        url: `${PUBLIC_PREFIX}/${file.filename}`,
      })),
    });
  });
});

app.delete("/api/uploads/:filename", (req, res) => {
  // basename() keeps a crafted name from escaping the uploads folder
  const target = path.join(UPLOAD_DIR, path.basename(req.params.filename));

  fs.unlink(target, (err) => {
    if (err) {
      res.status(err.code === "ENOENT" ? 404 : 500).json({ error: "Could not delete the file" });
      return;
    }
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`[uploads] listening on http://localhost:${PORT}`);
  console.log(`[uploads] writing to ${UPLOAD_DIR}`);
});
