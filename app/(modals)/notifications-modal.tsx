import BackButton from "@/components/back-button";
import Header from "@/components/header";
import ModalWrapper from "@/components/modal-wrapper";
import Typo from "@/components/typo";
import ConfirmDialog from "@/components/confirm-dialog";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useLocale } from "@/context/locale-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const CACHE_KEY = "cached_broadcasts";
const SEEN_KEY = "seen_broadcasts";

type NotifItem = {
  id: string;
  title: string;
  body: string;
  created_at?: string;
};

export default function NotificationsModal() {
  const { t } = useLocale();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      // tri plus récent d'abord
      list.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setItems(list);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      const filtered = items.filter((i) => i.id !== id);
      setItems(filtered);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      // aussi retirer des seen
      try {
        const raw = await AsyncStorage.getItem(SEEN_KEY);
        const seen: string[] = raw ? JSON.parse(raw) : [];
        const next = seen.filter((s) => s !== id);
        await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next));
      } catch {}
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const handleClearAll = async () => {
    setItems([]);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([]));
  };

  const renderItem = ({ item, index }: { item: NotifItem; index: number }) => {
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(18)}>
        <Pressable
          onLongPress={() => setConfirmId(item.id)}
          delayLongPress={500}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        >
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Icons.Bell size={18} color="#fff" weight="fill" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Typo size={15} fontWeight="700" color={colors.white} style={{ flex: 1 }} textProps={{ numberOfLines: 1 }}>
                {item.title}
              </Typo>
              {dateStr ? (
                <Typo size={11} color={colors.neutral400}>
                  {dateStr}
                </Typo>
              ) : null}
            </View>
            <Icons.Trash size={16} color={colors.neutral500} />
          </View>
          <Typo size={13} color={colors.neutral400} style={{ lineHeight: 18 }}>
            {item.body}
          </Typo>
          <View style={styles.hintRow}>
            <Icons.HandGrabbing size={12} color={colors.neutral500} />
            <Typo size={11} color={colors.neutral500}>
              Appui long pour supprimer
            </Typo>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title="Notifications" leftIcon={<BackButton fallback="/(tabs)/more" />} style={{ marginBottom: spacingY._10 }} />

        {items.length > 0 && (
          <Pressable onPress={() => setConfirmId("__clear_all__")} style={styles.clearBtn}>
            <Icons.Broom size={14} color={colors.neutral400} />
            <Typo size={13} color={colors.neutral400} fontWeight="600">
              Tout effacer
            </Typo>
          </Pressable>
        )}

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ gap: spacingY._12, paddingBottom: verticalScale(40), paddingTop: spacingY._10 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Icons.BellSlash size={32} color={colors.neutral500} weight="fill" />
              </View>
              <Typo size={16} fontWeight="600" color={colors.neutral400} style={{ textAlign: "center" }}>
                Aucune notification
              </Typo>
              <Typo size={13} color={colors.neutral500} style={{ textAlign: "center", marginTop: 6 }}>
                Les annonces et mises à jour apparaîtront ici.{"\n"}Reste connecté !
              </Typo>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <ConfirmDialog
        visible={!!confirmId}
        title={confirmId === "__clear_all__" ? "Tout effacer ?" : "Supprimer ?"}
        message={confirmId === "__clear_all__" ? "Toutes les notifications seront supprimées." : "Cette notification sera supprimée de la liste."}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          const id = confirmId!;
          setConfirmId(null);
          if (id === "__clear_all__") handleClearAll();
          else handleDelete(id);
        }}
      />
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: spacingY._10,
  },
  card: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._15,
    padding: spacingX._15,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacingX._10 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
  },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2, opacity: 0.8 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: verticalScale(60),
    gap: 8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.neutral800,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
