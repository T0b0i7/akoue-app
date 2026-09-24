import * as Icons from "phosphor-react-native";

export type WalletIconDef = {
  id: string;
  icon: any;
  label: string;
  bgColor: string;
};

export const WALLET_COLORS = [
  "#7A4DFF",
  "#16a34a",
  "#ef4444",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#10b981",
  "#f97316",
  "#3b82f6",
  "#6366f1",
  "#14b8a6",
];

export const WALLET_ICONS: WalletIconDef[] = [
  { id: "wallet", icon: Icons.Wallet, label: "Portefeuille", bgColor: "#7A4DFF" },
  { id: "bank", icon: Icons.Bank, label: "Banque", bgColor: "#0ea5e9" },
  { id: "card", icon: Icons.CreditCard, label: "Carte", bgColor: "#6366f1" },
  { id: "piggy", icon: Icons.PiggyBank, label: "Épargne", bgColor: "#16a34a" },
  { id: "cash", icon: Icons.Money, label: "Cash", bgColor: "#10b981" },
  { id: "coins", icon: Icons.Coins, label: "Monnaie", bgColor: "#f59e0b" },
  { id: "house", icon: Icons.House, label: "Maison", bgColor: "#ef4444" },
  { id: "car", icon: Icons.Car, label: "Voiture", bgColor: "#f97316" },
  { id: "plane", icon: Icons.Airplane, label: "Voyage", bgColor: "#06b6d4" },
  { id: "bag", icon: Icons.ShoppingBag, label: "Shopping", bgColor: "#ec4899" },
  { id: "cart", icon: Icons.ShoppingCart, label: "Courses", bgColor: "#8b5cf6" },
  { id: "food", icon: Icons.Hamburger, label: "Food", bgColor: "#e11d48" },
  { id: "game", icon: Icons.GameController, label: "Loisir", bgColor: "#a21caf" },
  { id: "music", icon: Icons.MusicNotes, label: "Musique", bgColor: "#14b8a6" },
  { id: "health", icon: Icons.Heart, label: "Santé", bgColor: "#be185d" },
  { id: "work", icon: Icons.Briefcase, label: "Travail", bgColor: "#525252" },
  { id: "grad", icon: Icons.GraduationCap, label: "Études", bgColor: "#075985" },
  { id: "gift", icon: Icons.Gift, label: "Cadeau", bgColor: "#ca8a04" },
  { id: "chart", icon: Icons.ChartBar, label: "Invest", bgColor: "#065F46" },
  { id: "buildings", icon: Icons.Buildings, label: "Immo", bgColor: "#404040" },
  { id: "fuel", icon: Icons.GasPump, label: "Carburant", bgColor: "#b45309" },
  { id: "phone", icon: Icons.DeviceMobile, label: "Mobile", bgColor: "#4B5563" },
  { id: "cat", icon: Icons.PawPrint, label: "Perso", bgColor: "#7c3aed" },
  { id: "dots", icon: Icons.DotsThreeOutline, label: "Autre", bgColor: "#737373" },
];

export function findWalletIcon(id: string) {
  return WALLET_ICONS.find((w) => w.id === id) || WALLET_ICONS[0];
}

export function parseIconString(value: string | null): { id: string; color: string } | null {
  if (!value || typeof value !== "string") return null;
  if (!value.startsWith("icon:")) return null;
  const [, id, color] = value.split(":");
  return { id: id || "wallet", color: color || WALLET_ICONS[0].bgColor };
}

export function toIconString(id: string, color: string) {
  return `icon:${id}:${color}`;
}
