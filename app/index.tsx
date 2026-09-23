import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

const Index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [logoReady, setLogoReady] = useState(false);
  useEffect(() => {
    // Délai réduit 800ms + attend que le logo soit décodé pour éviter apparition tardive
    const t = setTimeout(async () => {
      const lang = await AsyncStorage.getItem("app_locale");
      if (!lang) {
        router.replace("/language" as any);
        return;
      }
      if (user) router.replace("/(tabs)" as any);
      else router.replace("/(auth)/welcome" as any);
    }, 900);
    return () => clearTimeout(t);
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Image
          style={styles.logo}
          source={require("../public/images/splash-icon.png")}
          resizeMode="contain"
          fadeDuration={0}
          onLoadEnd={() => setLogoReady(true)}
        />
      </View>
      <Text style={styles.title}>Akouè</Text>
      <Text style={styles.subtitle}>Maîtrise ton argent</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      <Text style={styles.loading}>Chargement...</Text>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#171717",
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: "#7A4DFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7A4DFF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: { width: 96, height: 96, borderRadius: 16 },
  title: { marginTop: 24, fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  subtitle: { marginTop: 6, fontSize: 13, color: "#a3a3a3", letterSpacing: 2, textTransform: "uppercase" },
  loading: { marginTop: 12, fontSize: 13, color: "#737373" },
});
