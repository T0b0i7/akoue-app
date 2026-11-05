// Test OTP signup/resend pour l'adresse passée en argument.
// node scripts/test-otp.js <email>
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
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: node scripts/test-otp.js <email>");
    process.exitCode = 1;
    return;
  }
  console.log("1) signUp tentative...");
  const s = await supabase.auth.signUp({
    email,
    password: "Test1234!",
    options: { data: { name: "Test" } },
  });
  console.log("   error:", s.error ? s.error.message : "(aucune)");
  console.log("   session:", s.data.session ? "oui" : "non (confirmation requise)");
  console.log("   user:", s.data.user ? s.data.user.id : "(aucun)");

  console.log("2) resend OTP signup...");
  const r = await supabase.auth.resend({ type: "signup", email });
  console.log("   error:", r.error ? r.error.message : "(aucune)");
  console.log(r.error ? "ECOUTE : renvoi echoue." : `OK : code renvoye a ${email}. Verifie la boite et les spams.`);
})();
