/* eslint-env node */
// Seed réel — compte démo Eucher ABATTI + données fictives (bannière publication).
// Usage (depuis la racine projet): node scripts/seed-eucher.js
// Idempotent: si le compte existe déjà, connecte et remplace wallets/transactions.
const fs = require("fs");
const path = require("path");

const DEMO_EMAIL = "abattieucher+demo@gmail.com";
const DEMO_PASSWORD = "AkoueDemo2026!";
const DEMO_NAME = "Eucher ABATTI";

function loadEnv() {
  const raw = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();

async function main() {
  const env = loadEnv();
  const URL = env.EXPO_PUBLIC_SUPABASE_URL;
  const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) throw new Error(".env incomplet (URL / ANON_KEY manquants)");

  const authHeaders = { apikey: ANON, "Content-Type": "application/json" };

  // 1) signUp (ignore "already registered"), puis signIn
  const signup = await fetch(`${URL}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, data: { name: DEMO_NAME } }),
  }).then((r) => r.json());
  if (signup.user && !signup.session) {
    console.log("CONFIRM_REQUIRED: compte créé mais email à confirmer. Ouvre la boîte", DEMO_EMAIL, "clique le lien, puis relance ce script.");
    return;
  }

  const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  }).then((r) => r.json());
  if (!login.access_token) {
    if (String(login.msg || login.error_description || "").toLowerCase().includes("confirm")) {
      console.log("CONFIRM_REQUIRED: clique le lien envoyé à", DEMO_EMAIL, "puis relance ce script.");
      return;
    }
    throw new Error("Login impossible: " + JSON.stringify(login));
  }
  const token = login.access_token;
  const uid = login.user.id;
  console.log("Connecté:", uid, DEMO_EMAIL);

  const db = (table, method = "GET", body, prefer) => {
    const headers = { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    if (prefer) headers.Prefer = prefer;
    return fetch(`${URL}/rest/v1/${table}`, { method, headers, body: body ? JSON.stringify(body) : undefined }).then(async (r) => {
      const text = await r.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (!r.ok) throw new Error(`${method} ${table}: ${r.status} ${text}`);
      return data;
    });
  };

  // 2) Profil au nom de Eucher ABATTI
  await db("profiles", "POST", { id: uid, name: DEMO_NAME }, "resolution=merge-duplicates,return=representation");
  console.log("Profil OK:", DEMO_NAME);

  // 3) Remplace wallets/transactions existants (re-run propre)
  const oldWallets = (await db(`wallets?uid=eq.${uid}&select=id`)) || [];
  for (const w of oldWallets) {
    await db(`transactions?walletId=eq.${w.id}`, "DELETE");
    await db(`wallets?id=eq.${w.id}`, "DELETE");
  }

  // 4) Wallets (totaux cohérents avec les transactions ci-dessous)
  const wallets = await db("wallets", "POST", [
    { uid, name: "Espèces", amount: 317000, totalIncome: 350000, totalExpenses: 33000, currency: "XOF" },
    { uid, name: "Mobile Money", amount: 105000, totalIncome: 120000, totalExpenses: 15000, currency: "XOF" },
    { uid, name: "Compte Banque", amount: 425000, totalIncome: 500000, totalExpenses: 75000, currency: "XOF" },
  ], "return=representation");
  const wid = {};
  for (const w of wallets) wid[w.name] = w.id;
  console.log("Wallets OK:", wallets.map((w) => w.name).join(", "));

  // 5) Transactions fictives
  const txs = [
    { walletId: wid["Compte Banque"], type: "income", amount: 500000, category: "Épargne", description: "Virement initial", date: daysAgo(6) },
    { walletId: wid["Espèces"], type: "income", amount: 350000, category: "Salaire", description: "Salaire mensuel — Eucher ABATTI", date: daysAgo(5) },
    { walletId: wid["Espèces"], type: "expense", amount: 25000, category: "Alimentation", description: "Marché du mois", date: daysAgo(4) },
    { walletId: wid["Espèces"], type: "expense", amount: 8000, category: "Transport", description: "Taxi", date: daysAgo(3) },
    { walletId: wid["Mobile Money"], type: "income", amount: 120000, category: "Freelance", description: "Mission design logo", date: daysAgo(2) },
    { walletId: wid["Mobile Money"], type: "expense", amount: 15000, category: "Factures", description: "Forfait internet", date: daysAgo(1) },
    { walletId: wid["Compte Banque"], type: "expense", amount: 75000, category: "Logement", description: "Loyer octobre", date: daysAgo(1) },
  ].map((t) => ({ ...t, uid }));
  await db("transactions", "POST", txs, "return=representation");
  console.log("Transactions OK: 7");

  console.log("\nTERMINE — connecte-toi dans l'app avec:");
  console.log("  email:", DEMO_EMAIL);
  console.log("  mot de passe:", DEMO_PASSWORD);
}

main().catch((e) => { console.error("ECHEC:", e.message); process.exit(1); });
