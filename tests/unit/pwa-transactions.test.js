const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("PWA: installation et invitation après inscription", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  const serviceWorker = read("public/sw.js");
  const html = read("app/+html.tsx");
  const auth = read("context/auth-context.tsx");
  const appLayout = read("app/_layout.tsx");
  const prompt = read("components/pwa-install-prompt.tsx");

  it("utilise une URL racine et des icônes présentes pour l'installation", () => {
    assert.equal(manifest.start_url, "/");
    assert.equal(manifest.scope, "/");
    for (const icon of manifest.icons) {
      assert.ok(fs.existsSync(path.join(process.cwd(), "public", icon.src)));
    }
  });

  it("ne met pas en cache les requêtes API et sert les pages en réseau d'abord", () => {
    assert.match(serviceWorker, /\/\(auth\|rest\|storage\|functions\|realtime\)\\\//);
    assert.match(serviceWorker, /request\.mode === "navigate"[\s\S]*fetch\(request\)\.catch/);
    assert.doesNotMatch(serviceWorker, /splash-icon\.png/);
  });

  it("propose l'installation uniquement après une inscription ou vérification réussie", () => {
    assert.match(auth, /markPwaInstallPending\(email\)/);
    assert.match(auth, /clearPwaInstallPending\(email\)/);
    assert.match(appLayout, /<PwaInstallPrompt user=\{user\} \/>/);
    assert.match(prompt, /beforeinstallprompt|__akoueInstallPrompt/);
  });
});

describe("transactions: chargement et pagination", () => {
  const hook = read("hooks/use-supabase-data.ts");
  const home = read("app/(tabs)/index.tsx");
  const list = read("components/transaction-list.tsx");

  it("ne relance pas la requête à chaque mise à jour des résultats", () => {
    assert.match(hook, /}, \[uid, limit\]\);/);
    assert.doesNotMatch(hook, /\[uid, limit, offset, data\]/);
    assert.match(hook, /void fetch\(false\);[\s\S]*}, \[fetch\]\);/);
  });

  it("charge les pages suivantes sans remplacer la première page", () => {
    assert.match(hook, /if \(hasMore && !loading\) void fetch\(true, true\);/);
    assert.match(hook, /append \? \[\.\.\.dataRef\.current, \.\.\.mapped\] : mapped/);
  });

  it("affiche une erreur réseau et permet de réessayer", () => {
    assert.match(home, /error: recentTransactionsError/);
    assert.match(home, /onRetry=\{\(\) => \{ void refetchTransactions\(\); \}\}/);
    assert.match(list, /Réessayer/);
  });
});
