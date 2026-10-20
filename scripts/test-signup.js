// Test complet creation de compte + connexion via l'API Supabase (cle publique).
// node scripts/test-signup.js <email> [password]
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = {};
for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const email = process.argv[2];
  const password = process.argv[3] || "Test1234!";
  if (!email) {
    console.log("Usage: node scripts/test-signup.js <email> [password]");
    process.exit(1);
  }

  console.log("=== 1) CREATION DE COMPTE ===");
  const s = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: "Test Akoue" } },
  });
  console.log("  error   :", s.error ? s.error.message : "(aucune)");
  console.log("  session :", s.data.session ? "OUI -> connecte direct" : "NON -> confirmation email requise");
  console.log("  user id :", s.data.user ? s.data.user.id : "(aucun)");
  if (s.data.user && !s.data.session) {
    console.log("  -> un mail de confirmation a ete envoye (verifie la boite + spams).");
  }

  console.log("");
  console.log("=== 2) CONNEXION AVEC CE COMPTE ===");
  const l = await supabase.auth.signInWithPassword({ email, password });
  console.log("  error   :", l.error ? l.error.message : "(aucune)");
  console.log("  connecte:", l.data.session ? "OUI" : "NON");
  if (l.data.session) {
    console.log("  -> RESULTAT : creation + connexion OK.");
  } else {
    console.log("  -> RESULTAT : connexion KO (voir l'erreur ci-dessus).");
  }
})();
