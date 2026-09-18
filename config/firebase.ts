// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  getAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Initialize Firebase — mode mock si clés manquantes (permet de lancer le web sans Firebase)
let app: any = null;
let auth: any = null;
let firestore: any = null;

if (!isFirebaseConfigured) {
  console.warn(
    "[firebase] EXPO_PUBLIC_FIREBASE_* manquantes — mode MOCK actif. Crée un .env avec tes clés Firebase ou laisse en mock pour le dev web."
  );
  // Mock minimal pour que auth-context ne crash pas
  auth = {
    currentUser: null,
    onAuthStateChanged: (_cb: any) => {
      // callback immédiat en mode mock
      setTimeout(() => _cb(null), 0);
      return () => {};
    },
    signOut: async () => {},
  };
  firestore = {
    // stub — les appels getDoc/setDoc échoueront silencieusement en mock
  };
} else {
  app = initializeApp(firebaseConfig);
  //auth — persistence conditionnelle web / native (fix: getReactNativePersistence is not a function on web)
  if (Platform.OS === "web") {
    try {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } catch {
      auth = getAuth(app);
    }
  } else {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(app);
    }
  }
  //database
  firestore = getFirestore(app);
}
// const storage = getStorage(app);

export { auth, firestore, isFirebaseConfigured };
