import { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, UserType } from "@/types";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useRouter, usePathname } from "expo-router";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as bcrypt from "bcryptjs";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { clearPwaInstallPending, markPwaInstallPending } from "@/services/pwa-install";

WebBrowser.maybeCompleteAuthSession();

const OFFLINE_USER_KEY = "offline_user";
const OFFLINE_USERS_KEY = "offline_users"; // [{email,passwordHash,uid,name}]
const AUTH_SESSION_MODE_KEY = "auth_session_mode";
const isOfflineError = (msg: string) => /fetch|network|offline|Failed to fetch|Network request failed/i.test(msg || "");
async function setAuthSessionMode(mode: "supabase" | "offline") {
  try {
    await AsyncStorage.setItem(AUTH_SESSION_MODE_KEY, mode);
  } catch (error: any) {
    console.warn("[auth] Impossible d'enregistrer le mode de session :", error?.message || error);
  }
}

async function clearCachedRemoteSession() {
  try {
    await AsyncStorage.multiRemove([OFFLINE_USER_KEY, "mock_user", AUTH_SESSION_MODE_KEY]);
  } catch (error: any) {
    console.warn("[auth] Impossible d'effacer la session locale obsolète :", error?.message || error);
  }
}

// Compte créé mais email jamais confirmé (Supabase "Confirm email" actif)
const isNotConfirmed = (msg: string) => /confirm|not confirmed|email not confirmed/i.test(msg || "");
const NOT_CONFIRMED_MSG = "Compte non confirmé. Vérifie ta boîte mail (pense aux spams), clique le lien, puis reconnecte-toi.";

// rate limiting login
const RATE_KEY = "login_rate";
async function checkRateLimit(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(RATE_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, first: Date.now() };
    const now = Date.now();
    // reset après 15min
    if (now - data.first > 15 * 60 * 1000) {
      await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ count: 0, first: now }));
      return null;
    }
    if (data.count >= 5) {
      const wait = Math.ceil((15 * 60 * 1000 - (now - data.first)) / 60000);
      return `Trop de tentatives. Réessayez dans ${wait} min.`;
    }
    return null;
  } catch { return null; }
}
async function incRateLimit() {
  try {
    const raw = await AsyncStorage.getItem(RATE_KEY);
    const data = raw ? JSON.parse(raw) : { count: 0, first: Date.now() };
    if (Date.now() - data.first > 15 * 60 * 1000) {
      await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ count: 1, first: Date.now() }));
    } else {
      await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ count: data.count + 1, first: data.first }));
    }
  } catch {}
}
async function resetRateLimit() {
  try { await AsyncStorage.removeItem(RATE_KEY); } catch {}
}

async function getOfflineUsers(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function hashPassword(p: string): Promise<string> {
  try { return await bcrypt.hash(p, 10); } catch { return p; }
}
async function verifyPassword(p: string, hash: string): Promise<boolean> {
  try {
    // support migration: ancien stockage en clair
    if (hash && !hash.startsWith("$2")) return p === hash;
    return await bcrypt.compare(p, hash);
  } catch { return p === hash; }
}
async function saveOfflineUser(user: NonNullable<UserType>, password: string, verified = true) {
  try {
    const users = await getOfflineUsers();
    const idx = users.findIndex((u: any) => u.email.toLowerCase() === user.email?.toLowerCase());
    const passwordHash = await hashPassword(password);
    const entry = { email: user.email, passwordHash, uid: user.uid, name: user.name, verified };
    // ne jamais stocker le mot de passe en clair
    if (idx >= 0) users[idx] = entry; else users.push(entry);
    await AsyncStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(users));
    if (verified) {
      await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
      await AsyncStorage.setItem("mock_user", JSON.stringify(user));
    }
  } catch {}
}
async function markOfflineVerified(email: string) {
  try {
    const users = await getOfflineUsers();
    const idx = users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      users[idx].verified = true;
      await AsyncStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(users));
    }
  } catch {}
}
async function getOfflineSession(): Promise<UserType | null> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_USER_KEY) || await AsyncStorage.getItem("mock_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserType>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initializing) return;
    // Ne pas rediriger pendant le splash/index, la langue ou la configuration du verrou.
    if (!pathname || pathname === "/" || pathname === "/language" || pathname === "/app-lock-setup") return;
    const inAuth = pathname?.startsWith("/welcome") || pathname?.startsWith("/login") || pathname?.startsWith("/sign-up") || pathname?.startsWith("/forgot") || pathname?.startsWith("/(auth)");
    if (user && inAuth) router.replace("/(tabs)" as any);
    else if (!user && !inAuth) {
      // évite de forcer welcome si on est sur tabs sans user (tabs/_layout gère déjà)
      const inTabs = pathname?.startsWith("/(tabs)") || pathname === "/more" || pathname === "/wallet" || pathname === "/statistics";
      if (!inTabs) router.replace("/(auth)/welcome" as any);
    }
  }, [initializing, user, pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const offline = await getOfflineSession();
      if (!isSupabaseConfigured) {
        if (offline && !cancelled) setUser(offline);
        if (!cancelled) setInitializing(false);
        return;
      }

      try {
        const { data: { session } }: any = await supabase.auth.getSession();
        if (session?.user) {
          const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
          if (error) {
            if (isOfflineError(error.message) && offline?.uid === session.user.id) {
              if (!cancelled) setUser(offline);
            } else {
              await supabase.auth.signOut({ scope: "local" });
              await clearCachedRemoteSession();
              if (!cancelled) setUser(null);
            }
          } else if (verifiedUser && !cancelled) {
            const u: UserType = {
              uid: verifiedUser.id,
              email: verifiedUser.email ?? null,
              name: (verifiedUser.user_metadata?.name as string) ?? verifiedUser.email?.split("@")[0] ?? null,
              image: (verifiedUser.user_metadata?.avatar_url as string) ?? null,
            };
            setUser(u);
            await setAuthSessionMode("supabase");
            await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
            updateUserData(verifiedUser.id);
          } else {
            await supabase.auth.signOut({ scope: "local" });
            await clearCachedRemoteSession();
            if (!cancelled) setUser(null);
          }
        } else {
          const mode = await AsyncStorage.getItem(AUTH_SESSION_MODE_KEY);
          if (!cancelled && offline && (mode === "offline" || offline.uid?.startsWith("offline-"))) {
            setUser(offline);
          } else {
            await clearCachedRemoteSession();
            if (!cancelled) setUser(null);
          }
        }
      } catch (error: any) {
        const mode = await AsyncStorage.getItem(AUTH_SESSION_MODE_KEY).catch(() => null);
        if (!cancelled && offline && (mode === "offline" || offline.uid?.startsWith("offline-"))) {
          setUser(offline);
        } else if (!isOfflineError(error?.message)) {
          await clearCachedRemoteSession();
          if (!cancelled) setUser(null);
        } else if (!cancelled && offline && mode === "supabase") {
          setUser(offline);
        }
      }
      if (!cancelled) setInitializing(false);
    })();

    if (!isSupabaseConfigured) return () => {};

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        const u: UserType = {
          uid: session.user.id,
          email: session.user.email ?? null,
          name: (session.user.user_metadata?.name as string) ?? session.user.email?.split("@")[0] ?? null,
          image: (session.user.user_metadata?.avatar_url as string) ?? null,
        };
        setUser(u);
        await setAuthSessionMode("supabase");
        try { await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u)); } catch {}
        updateUserData(session.user.id);
      } else {
        const off = await getOfflineSession();
        const mode = await AsyncStorage.getItem(AUTH_SESSION_MODE_KEY).catch(() => null);
        if (off && (mode === "offline" || off.uid?.startsWith("offline-"))) {
          setUser(off);
        } else {
          await clearCachedRemoteSession();
          setUser(null);
        }
      }
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // rate limiting
    const rateMsg = await checkRateLimit();
    if (rateMsg) return { success: false, msg: rateMsg };
    // validation basique
    if (!email?.includes("@") || !password || password.length < 6) {
      await incRateLimit();
      return { success: false, msg: "Email ou mot de passe incorrect" };
    }
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          await setAuthSessionMode("supabase");
          await resetRateLimit();
          return { success: true };
        }
        if (isNotConfirmed(error.message)) {
          return { success: false, needsVerification: true, msg: NOT_CONFIRMED_MSG };
        }
        if (!isOfflineError(error.message)) {
          await incRateLimit();
          let msg = error.message;
          if (msg.includes("Invalid login credentials")) msg = "Email ou mot de passe incorrect";
          return { success: false, msg };
        }
        // offline → fallback ci-dessous (uniquement comptes déjà créés)
      }
      // Fallback offline : seulement comptes verifies crees localement avec verif hash
      const users = await getOfflineUsers();
      const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        if (found.verified === false) {
          await incRateLimit();
          return { success: false, needsVerification: true, msg: "Compte non verifie. Reconnecte-toi en ligne pour valider le code OTP." };
        }
        const hash = found.passwordHash || found.password;
        const ok = await verifyPassword(password, hash);
        if (ok) {
          const u: UserType = { uid: found.uid, email: found.email, name: found.name, image: null };
          setUser(u);
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
          await setAuthSessionMode("offline");
          await resetRateLimit();
          return { success: true };
        }
      }
      await incRateLimit();
      return { success: false, msg: "Email ou mot de passe incorrect (hors ligne - compte non trouvé)" };
    } catch (error: any) {
      if (isOfflineError(error.message)) {
        const users = await getOfflineUsers();
        const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          if (found.verified === false) {
            await incRateLimit();
            return { success: false, needsVerification: true, msg: "Compte non verifie. Reconnecte-toi en ligne pour valider le code OTP." };
          }
          const hash = found.passwordHash || found.password;
          const ok = await verifyPassword(password, hash);
          if (ok) {
            const u: UserType = { uid: found.uid, email: found.email, name: found.name, image: null };
            setUser(u);
            await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
            await setAuthSessionMode("offline");
            await resetRateLimit();
            return { success: true };
          }
        }
        await incRateLimit();
        return { success: false, msg: "Hors ligne : compte non trouve" };
      }
      await incRateLimit();
      return { success: false, msg: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const rateMsg = await checkRateLimit();
    if (rateMsg) return { success: false, msg: rateMsg };
    if (!email?.includes("@") || password.length < 6 || name.trim().length < 2) {
      return { success: false, msg: "Données invalides" };
    }
    try {
      if (isSupabaseConfigured) {
        await markPwaInstallPending(email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: "akoue://login" },
        });
        if (!error) {
          // Pas de session = email de confirmation en attente : ne pas faire croire que c'est connecté
          if (!data.session) {
            return { success: false, needsVerification: true, msg: "Compte créé ! Saisis le code à 6 chiffres reçu par mail (pense aux spams)." };
          }
          if (data.user) {
            try { await supabase.from("profiles").insert({ id: data.user.id, name, email, image: null }); } catch {}
            const u: UserType = { uid: data.user.id, email: data.user.email ?? email, name, image: null };
            await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
            await saveOfflineUser(u, password, true);
          }
          await resetRateLimit();
          return { success: true };
        }
        await clearPwaInstallPending(email);
        if (!isOfflineError(error.message)) {
          await incRateLimit();
          const low = error.message.toLowerCase();
          let msg = error.message;
          if (low.includes("already registered") || low.includes("already exists") || low.includes("user already")) {
            msg = "Email déjà utilisé. Connecte-toi, ou utilise « Mot de passe oublié », ou Google.";
          } else if (low.includes("rate limit") || low.includes("too many") || low.includes("429")) {
            msg = "Trop d'emails envoyés récemment (limite Supabase). Attends 1 h, ou connecte-toi avec Google.";
          } else if (low.includes("sending") || low.includes("smtp") || low.includes("confirmation email")) {
            msg = "Service mail indisponible (SMTP). Attends 1 min et réessaie, ou connecte-toi avec Google.";
          }
          // En dev, on affiche l'erreur brute pour diagnostiquer le vrai motif.
          return { success: false, msg: __DEV__ ? `${msg} [${error.message}]` : msg };
        }
        // offline → fallback local (uniquement si pas online)
      }
      // Fallback offline : compte local Marque NON VERIFIE, jamais connecte sans OTP
      const users = await getOfflineUsers();
      if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, msg: "Email déjà utilisé (hors ligne)" };
      }
      const uid = `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const u: UserType = { uid, email, name, image: null };
      await saveOfflineUser(u, password, false);
      await resetRateLimit();
      return { success: false, needsVerification: true, msg: "Compte pre-cree hors ligne, non valide tant que le code OTP n est pas saisi. Reconnecte-toi en ligne pour recevoir le code." };
    } catch (error: any) {
      if (isOfflineError(error.message)) {
        const users = await getOfflineUsers();
        if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, msg: "Email déjà utilisé (hors ligne)" };
        }
        const uid = `offline-${Date.now().toString(36)}`;
        const u: UserType = { uid, email, name, image: null };
        await saveOfflineUser(u, password, false);
        await resetRateLimit();
        return { success: false, needsVerification: true, msg: "Compte pre-cree hors ligne, non valide tant que le code OTP n est pas saisi. Reconnecte-toi en ligne pour recevoir le code." };
      }
      await incRateLimit();
      return { success: false, msg: error.message };
    }
  };

  const resendConfirmation = async (email: string) => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
    const rateMsg = await checkRateLimit();
    if (rateMsg) return { success: false, msg: rateMsg };
    if (!email?.includes("@")) return { success: false, msg: "Email invalide" };
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: "akoue://login" } });
      if (error) {
        await incRateLimit();
        return { success: false, msg: error.message };
      }
      return { success: true, msg: "Nouveau code renvoyé. Vérifie ta boîte mail (pense aux spams)." };
    } catch (error: any) {
      await incRateLimit();
      return { success: false, msg: error.message };
    }
  };

  const verifyCode = async (email: string, code: string) => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
    const clean = code.trim().replace(/\s/g, "");
    if (!email?.includes("@") || clean.length !== 6) return { success: false, msg: "Le code doit contenir 6 chiffres" };
    try {
      await markPwaInstallPending(email);
      const { data, error } = await supabase.auth.verifyOtp({ email, token: clean, type: "email" });
      if (error) {
        await clearPwaInstallPending(email);
        if (__DEV__) console.warn("[auth] Échec de vérification OTP :", error.message);
        const msg = error.message.toLowerCase();
        // Supabase renvoie "Token has expired or is invalid" dans les deux cas :
        // on ne peut pas distinguer, on guide vers le dernier code recu.
        if (msg.includes("expired") || msg.includes("invalid") || msg.includes("token")) return { success: false, msg: "Code incorrect ou expire. Saisis le DERNIER code recu, sans espace. Compte deja confirme ? Connecte-toi directement." };
        return { success: false, msg: error.message };
      }
      if (data.user) {
        try {
          const metaName = (data.user.user_metadata?.name as string) ?? data.user.email?.split("@")[0] ?? null;
          await supabase.from("profiles").upsert({ id: data.user.id, name: metaName, email: data.user.email ?? email, image: null });
        } catch {}
        const u: UserType = { uid: data.user.id, email: data.user.email ?? email, name: (data.user.user_metadata?.name as string) ?? null, image: null };
        try { await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u)); } catch {}
        await markOfflineVerified(email);
        await resetRateLimit();
        return { success: true, msg: "Compte confirmé !" };
      }
      return { success: false, msg: "Code invalide" };
    } catch (error: any) {
      await clearPwaInstallPending(email);
      return { success: false, msg: error.message };
    }
  };

  const forgotPassword = async (email: string) => {    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configure" };
    const rateMsg = await checkRateLimit();
    if (rateMsg) return { success: false, msg: rateMsg };
    const clean = email?.trim().toLowerCase();
    if (!clean?.includes("@")) return { success: false, msg: "Email invalide" };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: "akoue://reset-password" });
      if (error) {
        await incRateLimit();
        return { success: false, msg: error.message };
      }
      await resetRateLimit();
      return { success: true };
    } catch (error: any) {
      await incRateLimit();
      return { success: false, msg: error.message };
    }
  };

  const updateUserData = async (uid: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (error) return;
      if (data) {
        setUser((prev) => prev ? { ...prev, name: data.name ?? prev.name, image: data.image ?? prev.image } : prev);
      }
    } catch {
      // Profil distant illisible (offline) : on garde la session locale
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; msg?: string }> => {    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
    try {
      const { data: { user: cur } } = await supabase.auth.getUser();
      if (!cur?.email) return { success: false, msg: "Utilisateur non trouvé" };
      // Re-auth with old password
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: cur.email, password: oldPassword });
      if (signInError) return { success: false, msg: "Ancien mot de passe incorrect" };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, msg: error.message };
      return { success: true, msg: "Mot de passe mis à jour" };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; msg?: string; redirecting?: boolean }> => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
    try {
      // WEB : redirection pleine page. Un popup lancé après un await est bloqué
      // par les navigateurs (le geste utilisateur est perdu) -> on ne l'utilise pas.
      if (Platform.OS === "web") {
        const redirectTo =
          typeof window !== "undefined" ? window.location.origin + "/" : undefined;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) return { success: false, msg: error.message };
        // Le navigateur part vers Google : les appelants ne doivent PAS naviguer.
        return { success: true, redirecting: true };
      }

      const redirectTo = makeRedirectUri({ scheme: "akoue", path: "login" });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) return { success: false, msg: error?.message || "Google indisponible" };
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== "success") return { success: false, msg: "Connexion Google annulée" };
      const url = new URL(res.url);
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exError } = await supabase.auth.exchangeCodeForSession(code);
        if (exError) return { success: false, msg: exError.message };
        await resetRateLimit();
        return { success: true };
      }
      // Fallback implicite : tokens directs dans le hash
      const hash = res.url.split("#")[1] || "";
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const { error: sessError } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessError) return { success: false, msg: sessError.message };
        await resetRateLimit();
        return { success: true };
      }
      return { success: false, msg: "Retour Google illisible. Réessaie." };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) await supabase.auth.signOut().catch(() => {});
      setUser(null);
      try {
        await AsyncStorage.multiRemove([OFFLINE_USER_KEY, "mock_user", AUTH_SESSION_MODE_KEY]);
        // purge sensible: wallets, transactions, pending
        // SAUF prefs appareil : broadcasts vus/notifiés/snoozés + verrou (pas liés au compte)
        const keep = (k: string) =>
          k === "seen_broadcasts" || k === "notified_broadcasts" || k === "cached_broadcasts" ||
          k.startsWith("snoozed_bc_") || k === "app_lock_method" || k === "app_lock_hash" ||
          k === "face_lock_enabled" || k === "face_enrolled_at" || k === "app_lock_enroll_v2";
        const keys = await AsyncStorage.getAllKeys();
        const toRemove = keys.filter((k: string) => !keep(k) && (k.startsWith("wallets_") || k.startsWith("txs_") || k.startsWith("mock_") || k.startsWith("pending_") || k.startsWith("cached_") || k.startsWith("seen_")));
        if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
      } catch {}
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const contextValue: AuthContextType = {
    user,
    setUser,
    login,
    signUp,
    resendConfirmation,
    verifyCode,
    updateUserData,
    forgotPassword,
    loginWithGoogle,
    logout,
    updatePassword,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within a AuthProvider");
  return context;
};
