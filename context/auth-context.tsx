import { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, UserType } from "@/types";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useRouter, usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE_USER_KEY = "offline_user";
const OFFLINE_USERS_KEY = "offline_users"; // [{email,password,uid,name}]
const isOfflineError = (msg: string) => /fetch|network|offline|Failed to fetch|Network request failed/i.test(msg || "");

async function getOfflineUsers(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveOfflineUser(user: NonNullable<UserType>, password: string) {
  try {
    const users = await getOfflineUsers();
    const idx = users.findIndex((u: any) => u.email.toLowerCase() === user.email?.toLowerCase());
    const entry = { email: user.email, password, uid: user.uid, name: user.name };
    if (idx >= 0) users[idx] = entry; else users.push(entry);
    await AsyncStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(users));
    await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
    // aussi pour compat hooks
    await AsyncStorage.setItem("mock_user", JSON.stringify(user));
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
    const inAuth = pathname?.startsWith("/welcome") || pathname?.startsWith("/login") || pathname?.startsWith("/sign-up") || pathname?.startsWith("/forgot") || pathname?.startsWith("/(auth)");
    if (user && inAuth) router.replace("/(tabs)" as any);
    else if (!user && !inAuth) router.replace("/(auth)/welcome" as any);
  }, [initializing, user, pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) Toujours essayer de restaurer une session offline d'abord (mode avion)
      const offline = await getOfflineSession();
      if (offline && !cancelled) {
        setUser(offline);
      }

      if (!isSupabaseConfigured) {
        if (!cancelled) setInitializing(false);
        return;
      }

      // 2) Puis essayer Supabase — si offline, on garde la session offline
      try {
        const { data: { session } }: any = await supabase.auth.getSession();
        if (!cancelled && session?.user) {
          const u: UserType = {
            uid: session.user.id,
            email: session.user.email ?? null,
            name: (session.user.user_metadata?.name as string) ?? session.user.email?.split("@")[0] ?? null,
            image: (session.user.user_metadata?.avatar_url as string) ?? null,
          };
          setUser(u);
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
          updateUserData(session.user.id);
        }
      } catch {}
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
        try { await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u)); } catch {}
        updateUserData(session.user.id);
      } else {
        // Ne pas écraser la session offline si on est en mode avion (pas de session mais offline_user existe)
        const off = await getOfflineSession();
        if (!off) setUser(null);
      }
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // Toujours permettre le login offline (test app / mode avion)
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { success: true };
        if (!isOfflineError(error.message)) {
          let msg = error.message;
          if (msg.includes("Invalid login credentials")) msg = "Email ou mot de passe incorrect";
          return { success: false, msg };
        }
        // offline → fallback ci-dessous
      }
      // Fallback offline : cherche dans les comptes créés localement
      const users = await getOfflineUsers();
      const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (found) {
        const u: UserType = { uid: found.uid, email: found.email, name: found.name, image: null };
        setUser(u);
        await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
        return { success: true };
      }
      // Mode démo offline : si aucun compte, on crée une session à la volée (test app)
      // On accepte tout email valide + password >=6 comme compte offline auto-créé
      if (email.includes("@") && password.length >= 6) {
        const uid = `offline-${email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        const u: UserType = { uid, email, name: email.split("@")[0], image: null };
        setUser(u);
        await saveOfflineUser(u, password);
        return { success: true };
      }
      return { success: false, msg: "Email ou mot de passe incorrect (hors ligne)" };
    } catch (error: any) {
      if (isOfflineError(error.message)) {
        const users = await getOfflineUsers();
        const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (found) {
          const u: UserType = { uid: found.uid, email: found.email, name: found.name, image: null };
          setUser(u);
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
          return { success: true };
        }
      }
      return { success: false, msg: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (!error) {
          if (data.user) {
            try { await supabase.from("profiles").insert({ id: data.user.id, name, image: null }); } catch {}
            const u: UserType = { uid: data.user.id, email: data.user.email ?? email, name, image: null };
            await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(u));
            await saveOfflineUser(u, password);
          }
          return { success: true };
        }
        if (!isOfflineError(error.message)) {
          let msg = error.message;
          if (msg.includes("already registered")) msg = "Email déjà utilisé";
          return { success: false, msg };
        }
        // offline → fallback local
      }
      // Fallback offline : création locale
      const users = await getOfflineUsers();
      if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, msg: "Email déjà utilisé (hors ligne)" };
      }
      const uid = `offline-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const u: UserType = { uid, email, name, image: null };
      setUser(u);
      await saveOfflineUser(u, password);
      return { success: true };
    } catch (error: any) {
      if (isOfflineError(error.message)) {
        const uid = `offline-${Date.now().toString(36)}`;
        const u: UserType = { uid, email, name, image: null };
        setUser(u);
        await saveOfflineUser(u, password);
        return { success: true };
      }
      return { success: false, msg: error.message };
    }
  };

  const forgotPassword = async (email: string) => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, msg: error.message };
      return { success: true };
    } catch (error: any) {
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
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; msg?: string }> => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
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

  const logout = async () => {
    try {
      if (isSupabaseConfigured) await supabase.auth.signOut().catch(() => {});
      setUser(null);
      try {
        await AsyncStorage.removeItem(OFFLINE_USER_KEY);
        await AsyncStorage.removeItem("mock_user");
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
    updateUserData,
    forgotPassword,
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
