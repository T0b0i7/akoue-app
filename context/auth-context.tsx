import { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, UserType } from "@/types";
import { supabase, isSupabaseConfigured } from "@/config/supabase";
import { useRouter, usePathname } from "expo-router";

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
    if (!isSupabaseConfigured) {
      setInitializing(false);
      return () => {};
    }

    // Restore session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setUser({
          uid: session.user.id,
          email: session.user.email ?? null,
          name: (session.user.user_metadata?.name as string) ?? session.user.email?.split("@")[0] ?? null,
          image: (session.user.user_metadata?.avatar_url as string) ?? null,
        });
        updateUserData(session.user.id);
      }
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        setUser({
          uid: session.user.id,
          email: session.user.email ?? null,
          name: (session.user.user_metadata?.name as string) ?? session.user.email?.split("@")[0] ?? null,
          image: (session.user.user_metadata?.avatar_url as string) ?? null,
        });
        updateUserData(session.user.id);
      } else {
        setUser(null);
      }
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré — vérifie .env" };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let msg = error.message;
        if (msg.includes("Invalid login credentials")) msg = "Email ou mot de passe incorrect";
        return { success: false, msg };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured) return { success: false, msg: "Supabase non configuré" };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        let msg = error.message;
        if (msg.includes("already registered")) msg = "Email déjà utilisé";
        return { success: false, msg };
      }
      // Create profile row
      if (data.user) {
        await supabase.from("profiles").insert({ id: data.user.id, name, image: null });
      }
      return { success: true };
    } catch (error: any) {
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
      if (isSupabaseConfigured) await supabase.auth.signOut();
      setUser(null);
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
