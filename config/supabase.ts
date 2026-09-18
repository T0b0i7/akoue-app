import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL / ANON_KEY manquantes — mode MOCK actif. Configure .env avec les clés Supabase (Project Settings > API)."
  );
}

// Storage adaptateur web-safe : AsyncStorage sur native, localStorage sur web, no-op en SSR
const supabaseStorage = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve(null);
      try {
        return Promise.resolve(window.localStorage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      try {
        window.localStorage.setItem(key, value);
      } catch {}
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return Promise.resolve();
      try {
        window.localStorage.removeItem(key);
      } catch {}
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

// Client Supabase — persistence adaptative web/native
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: supabaseStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    })
  : ({
      // Mock minimal pour dev sans clés — évite les crashes dans auth-context
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: (_cb: any) => {
          setTimeout(() => _cb("SIGNED_OUT", null), 0);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase non configuré — ajoute les clés dans .env" },
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: "Supabase non configuré" },
        }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: null }),
        updateUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ data: [], error: null }), data: [], error: null }),
        insert: () => ({ select: () => ({ data: null, error: null }) }),
        update: () => ({ eq: () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => ({ error: null }) }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
    } as any);

export { isSupabaseConfigured };
