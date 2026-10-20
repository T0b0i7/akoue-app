// Test SMTP reel via l'API Supabase (cle publique du .env).
// Envoie un email de reinitialisation -> passe forcement par le SMTP configure.
// node scripts/test-smtp.js <email>
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
  if (!email) {
    console.log("Usage: node scripts/test-smtp.js <email>");
    process.exit(1);
  }
  console.log("Envoi d'un mail de reinitialisation a " + email + " ...");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "akoue://reset-password",
  });
  console.log("error:", error ? error.message : "(aucune)");
  console.log(
    error
      ? "ECHEC : le SMTP a refuse l'envoi."
      : "REQUETE OK : si l'email existe, un lien est parti. Verifie la boite + SPAMS."
  );
})();
