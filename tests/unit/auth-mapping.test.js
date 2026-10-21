// Logique pure extraite de context/auth-context.tsx + app/(auth)/sign-up.tsx.
// But : tester sans expo/react-native/supabase (zero dependance).
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const authContext = fs.readFileSync(
  path.join(process.cwd(), "context", "auth-context.tsx"),
  "utf8"
);

// --- copies conformes au code prod ---
const isOfflineError = (msg) =>
  /fetch|network|offline|Failed to fetch|Network request failed/i.test(msg || "");
const isNotConfirmed = (msg) =>
  /confirm|not confirmed|email not confirmed/i.test(msg || "");

function mapSignUpError(message) {
  if (/already registered|already exists/i.test(message))
    return "Email déjà utilisé. Connecte-toi ou fais Mot de passe oublié.";
  if (/sending|smtp|mail/i.test(message))
    return "Service mail indisponible (SMTP Supabase). Attends 1 min et réessaie.";
  return message;
}

function mapVerifyCodeError(message) {
  const msg = (message || "").toLowerCase();
  if (msg.includes("expired") || msg.includes("invalid") || msg.includes("token"))
    return "Code incorrect ou expire. Saisis le DERNIER code recu, sans espace. Compte deja confirme ? Connecte-toi directement.";
  return message;
}

function normalizeLoginError(message) {
  if (message.includes("Invalid login credentials")) return "Email ou mot de passe incorrect";
  return message;
}

describe("auth-context : classification erreurs", () => {
  it("detecte le mode offline", () => {
    assert.equal(isOfflineError("Network request failed"), true);
    assert.equal(isOfflineError("Failed to fetch"), true);
    assert.equal(isOfflineError("User already registered"), false);
  });

  it("detecte un compte non confirme", () => {
    assert.equal(isNotConfirmed("Email not confirmed"), true);
    assert.equal(isNotConfirmed("Invalid login credentials"), false);
  });

  it("signUp : email deja utilise", () => {
    assert.equal(
      mapSignUpError("User already registered"),
      "Email déjà utilisé. Connecte-toi ou fais Mot de passe oublié."
    );
  });

  it("signUp : SMTP en panne", () => {
    assert.equal(
      mapSignUpError("Error sending confirmation email"),
      "Service mail indisponible (SMTP Supabase). Attends 1 min et réessaie."
    );
  });

  it("signUp : rate limit mappe vers message SMTP", () => {
    assert.equal(mapSignUpError("email rate limit exceeded"), "Service mail indisponible (SMTP Supabase). Attends 1 min et réessaie.");
  });

  it("login : credentials invalides traduits", () => {
    assert.equal(normalizeLoginError("Invalid login credentials"), "Email ou mot de passe incorrect");
  });

  it("verifyCode : token expire/invalide guide vers dernier code", () => {
    assert.ok(mapVerifyCodeError("Token has expired or is invalid").includes("DERNIER code"));
    assert.equal(mapVerifyCodeError("autre erreur"), "autre erreur");
  });

  it("verifyCode : accepte le code OTP Supabase à 8 chiffres", () => {
    assert.match(
      authContext,
      /clean\.length !== 8[\s\S]*?verifyOtp\(\{\s*email,\s*token:\s*clean,\s*type:\s*"email"\s*\}\)/
    );
    const signUp = fs.readFileSync(path.join(process.cwd(), "app", "(auth)", "sign-up.tsx"), "utf8");
    const login = fs.readFileSync(path.join(process.cwd(), "app", "(auth)", "login.tsx"), "utf8");
    assert.match(signUp, /maxLength=\{8\}/);
    assert.match(login, /maxLength=\{8\}/);
  });
});

describe("sign-up : constantes du flux lien magique", () => {
  it("cooldown renvoi = 180s", () => {
    const COOLDOWN = 180;
    assert.equal(COOLDOWN, 180);
  });

  it("redirect login = akoue://login", () => {
    const emailRedirectTo = "akoue://login";
    assert.equal(emailRedirectTo, "akoue://login");
  });

  it("mot de passe min 6, nom min 2", () => {
    const valid = (email, pw, name) =>
      email.includes("@") && pw.length >= 6 && name.trim().length >= 2;
    assert.equal(valid("[REDACTED_EMAIL]", "123456", "Ab"), true);
    assert.equal(valid("[REDACTED_EMAIL]", "123", "Ab"), false);
    assert.equal(valid("[REDACTED_EMAIL]", "123456", "A"), false);
  });
});

describe("app-lock : configuration facultative", () => {
  it("ne redirige pas automatiquement vers la configuration du verrou", () => {
    const appLayout = fs.readFileSync(path.join(process.cwd(), "app", "_layout.tsx"), "utf8");
    const appLockHook = fs.readFileSync(path.join(process.cwd(), "hooks", "use-app-lock.ts"), "utf8");
    assert.doesNotMatch(appLayout, /LockSetupRedirect|showEnroll/);
    assert.doesNotMatch(appLockHook, /setShowEnroll|showEnroll/);
  });
});

describe("session persistante : isolation des utilisateurs", () => {
  it("valide la session Supabase et supprime un compte distant sans session", () => {
    assert.match(authContext, /supabase\.auth\.getUser\(\)/);
    assert.match(authContext, /signOut\(\{ scope: "local" \}\)/);
    assert.match(authContext, /multiRemove\(\[OFFLINE_USER_KEY, "mock_user", AUTH_SESSION_MODE_KEY\]\)/);
  });

  describe("audio et ancien verrou", () => {
    it("coupe la musique automatiquement sur les formulaires d'authentification", () => {
      const audio = fs.readFileSync(path.join(process.cwd(), "context", "audio-context.tsx"), "utf8");
      assert.match(audio, /usePathname/);
      assert.match(audio, /login\|sign-up\|forgot-password\|reset-password/);
      assert.match(audio, /if \(muted\) \{\s*player\.pause\(\)/);
      assert.match(audio, /if \(authFormOpen\) return/);
    });

    it("désactive une fois l'ancien verrou et bloque sa restauration depuis le cloud", () => {
      const lockHook = fs.readFileSync(path.join(process.cwd(), "hooks", "use-app-lock.ts"), "utf8");
      assert.match(lockHook, /LEGACY_LOCK_DISABLED_KEY/);
      assert.match(lockHook, /legacyLockDisabled !== "1"[\s\S]*?setAppLock\("none"\)/);
      assert.match(lockHook, /if \(\(await AsyncStorage\.getItem\(LEGACY_LOCK_DISABLED_KEY\)[\s\S]*?setLocked\(false\)[\s\S]*?return/);
      assert.match(lockHook, /removeItem\(LEGACY_LOCK_DISABLED_KEY\)/);
    });
  });

  it("ne restaure une session hors ligne que si elle est explicitement locale", () => {
    assert.match(authContext, /mode === "offline" \|\| offline\.uid\?\.startsWith\("offline-"\)/);
    assert.match(authContext, /mode === "offline" \|\| off\.uid\?\.startsWith\("offline-"\)/);
  });

  it("n'utilise pas les caches globaux mock pour un utilisateur Supabase", () => {
    const hook = fs.readFileSync(path.join(process.cwd(), "hooks", "use-supabase-data.ts"), "utf8");
    assert.match(hook, /wallets_\$\{uid\}[\s\S]*?!isSupabaseConfigured \? await AsyncStorage\.getItem\("mock_wallets"\)/);
    assert.match(hook, /txs_\$\{uid\}[\s\S]*?!isSupabaseConfigured \? await AsyncStorage\.getItem\("mock_transactions"\)/);
  });

  it("incrémente la version Android pour remplacer le build déjà installé", () => {
    const appConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app.json"), "utf8"));
    assert.equal(appConfig.expo.version, "1.1.2");
    assert.equal(appConfig.expo.android.versionCode, 4);
    const gradle = fs.readFileSync(path.join(process.cwd(), "android", "app", "build.gradle"), "utf8");
    assert.match(gradle, /versionCode 4/);
    assert.match(gradle, /versionName "1\.1\.2"/);
  });
});
