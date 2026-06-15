#!/usr/bin/env node
// build.js — rebuilds index.html by re-embedding source .js/.jsx files
// Usage: node build.js
// The HTML template is the EXISTING index.html; this script replaces only the
// inline <script> blocks that correspond to the source files.

const fs = require("fs");
const path = require("path");
const Babel = require("@babel/standalone");

const HTML_PATH = path.join(__dirname, "index.html");

// Files to embed and their order/comment markers in the HTML
// "raw" = embed as-is; "jsx" = compile with Babel first
const SOURCE_FILES = [
  { file: "data.js",            comment: "/* data.js */",                     type: "raw" },
  { file: "store.js",           comment: "/* store.js */",                     type: "raw" },
  { file: "cloud.js",           comment: "/* cloud.js */",                     type: "raw" },
  { file: "tweaks-panel.jsx",   comment: "/* tweaks-panel.jsx (precompiled) */",type: "jsx" },
  { file: "primitives.jsx",     comment: "/* primitives.jsx (precompiled) */",  type: "jsx" },
  { file: "image-slot.js",      comment: "/* image-slot.js */",                type: "raw" },
  { file: "layout.jsx",         comment: "/* layout.jsx (precompiled) */",      type: "jsx" },
  { file: "dashboard.jsx",      comment: "/* dashboard.jsx (precompiled) */",   type: "jsx" },
  { file: "pages.jsx",          comment: "/* pages.jsx (precompiled) */",       type: "jsx" },
  { file: "settings.jsx",       comment: "/* settings.jsx (precompiled) */",    type: "jsx" },
  { file: "onboarding.jsx",     comment: "/* onboarding.jsx (precompiled) */",  type: "jsx" },
  { file: "app.jsx",            comment: "/* app.jsx (precompiled) */",         type: "jsx" },
];

function compileJSX(src, filename) {
  const result = Babel.transform(src, {
    presets: ["react"],
    plugins: [],
    filename,
  });
  return result.code;
}

function embedFile(entry) {
  const src = fs.readFileSync(path.join(__dirname, entry.file), "utf8");
  const content = entry.type === "jsx" ? compileJSX(src, entry.file) : src;
  return `<script>${entry.comment}\n${content}\n</script>`;
}

let html = fs.readFileSync(HTML_PATH, "utf8");

for (const entry of SOURCE_FILES) {
  if (!fs.existsSync(path.join(__dirname, entry.file))) {
    console.warn(`⚠  Skipping ${entry.file} (not found)`);
    continue;
  }

  // Match the <script> block by its comment marker
  // Pattern: <script>COMMENT\n...content...\n</script>
  const escapedComment = entry.comment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<script>${escapedComment}[\\s\\S]*?<\\/script>`,
    "m"
  );

  const replacement = embedFile(entry);
  if (pattern.test(html)) {
    html = html.replace(pattern, replacement);
    console.log(`✓  Embedded ${entry.file}`);
  } else {
    console.warn(`⚠  Marker not found for ${entry.file}: ${entry.comment}`);
  }
}

fs.writeFileSync(HTML_PATH, html, "utf8");
console.log("\n✅  index.html rebuilt successfully.");
