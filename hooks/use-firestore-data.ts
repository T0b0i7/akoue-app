import { firestore, isFirebaseConfigured } from "@/config/firebase";
import {
  collection,
  onSnapshot,
  query,
  QueryConstraint,
  DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useFirestoreData = <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
) => {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // MOCK MODE — lecture depuis AsyncStorage (doit être avant tout appel firestore)
    if (!isFirebaseConfigured) {
      setLoading(true);
      const loadMock = async () => {
        try {
          const key = collectionName === "wallets" ? "mock_wallets" : collectionName === "transactions" ? "mock_transactions" : `mock_${collectionName}`;
          const raw = await AsyncStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : [];
          // Convertit les dates string -> Date pour cohérence
          setData(parsed as any);
          setError(null);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
      loadMock();
      // Poll toutes les 1s pour simuler temps réel en mock
      const interval = setInterval(loadMock, 1000);
      return () => clearInterval(interval);
    }

    // Mode Firebase réel — crée la query uniquement ici
    const firestoreQuery =
      collectionName && constraints.length > 0
        ? query(collection(firestore, collectionName), ...constraints)
        : null;

    if (!firestoreQuery) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (T & { id: string })[];
        setData(fetchedData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [enabled, collectionName]);

  return { data, loading, error };
};
