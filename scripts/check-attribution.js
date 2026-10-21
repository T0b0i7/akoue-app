const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const attribution = "Copyright (c) 2026 Akouè — Créé par [redacted-name]";
const files = ["LICENSE", "README.md", "app/_layout.tsx"];
const missing = files.filter((file) => !fs.readFileSync(path.join(root, file), "utf8").includes(attribution));

if (missing.length) {
  console.error(`Attribution missing from: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Attribution is present in the license, README, and app entry point.");
}
