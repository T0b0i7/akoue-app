import { AirplaneIcon as IconAirplane } from "phosphor-react-native/src/icons/Airplane";
import { BankIcon as IconBank } from "phosphor-react-native/src/icons/Bank";
import { BriefcaseIcon as IconBriefcase } from "phosphor-react-native/src/icons/Briefcase";
import { BuildingsIcon as IconBuildings } from "phosphor-react-native/src/icons/Buildings";
import { CarIcon as IconCar } from "phosphor-react-native/src/icons/Car";
import { ChartBarIcon as IconChartBar } from "phosphor-react-native/src/icons/ChartBar";
import { CoinsIcon as IconCoins } from "phosphor-react-native/src/icons/Coins";
import { CreditCardIcon as IconCreditCard } from "phosphor-react-native/src/icons/CreditCard";
import { DeviceMobileIcon as IconDeviceMobile } from "phosphor-react-native/src/icons/DeviceMobile";
import { DotsThreeOutlineIcon as IconDotsThreeOutline } from "phosphor-react-native/src/icons/DotsThreeOutline";
import { GameControllerIcon as IconGameController } from "phosphor-react-native/src/icons/GameController";
import { GasPumpIcon as IconGasPump } from "phosphor-react-native/src/icons/GasPump";
import { GiftIcon as IconGift } from "phosphor-react-native/src/icons/Gift";
import { GraduationCapIcon as IconGraduationCap } from "phosphor-react-native/src/icons/GraduationCap";
import { HamburgerIcon as IconHamburger } from "phosphor-react-native/src/icons/Hamburger";
import { HeartIcon as IconHeart } from "phosphor-react-native/src/icons/Heart";
import { HouseIcon as IconHouse } from "phosphor-react-native/src/icons/House";
import { MoneyIcon as IconMoney } from "phosphor-react-native/src/icons/Money";
import { MusicNotesIcon as IconMusicNotes } from "phosphor-react-native/src/icons/MusicNotes";
import { PawPrintIcon as IconPawPrint } from "phosphor-react-native/src/icons/PawPrint";
import { PiggyBankIcon as IconPiggyBank } from "phosphor-react-native/src/icons/PiggyBank";
import { ShoppingBagIcon as IconShoppingBag } from "phosphor-react-native/src/icons/ShoppingBag";
import { ShoppingCartIcon as IconShoppingCart } from "phosphor-react-native/src/icons/ShoppingCart";
import { WalletIcon as IconWallet } from "phosphor-react-native/src/icons/Wallet";

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
  { id: "wallet", icon: IconWallet, label: "Portefeuille", bgColor: "#7A4DFF" },
  { id: "bank", icon: IconBank, label: "Banque", bgColor: "#0ea5e9" },
  { id: "card", icon: IconCreditCard, label: "Carte", bgColor: "#6366f1" },
  { id: "piggy", icon: IconPiggyBank, label: "Épargne", bgColor: "#16a34a" },
  { id: "cash", icon: IconMoney, label: "Cash", bgColor: "#10b981" },
  { id: "coins", icon: IconCoins, label: "Monnaie", bgColor: "#f59e0b" },
  { id: "house", icon: IconHouse, label: "Maison", bgColor: "#ef4444" },
  { id: "car", icon: IconCar, label: "Voiture", bgColor: "#f97316" },
  { id: "plane", icon: IconAirplane, label: "Voyage", bgColor: "#06b6d4" },
  { id: "bag", icon: IconShoppingBag, label: "Shopping", bgColor: "#ec4899" },
  { id: "cart", icon: IconShoppingCart, label: "Courses", bgColor: "#8b5cf6" },
  { id: "food", icon: IconHamburger, label: "Food", bgColor: "#e11d48" },
  { id: "game", icon: IconGameController, label: "Loisir", bgColor: "#a21caf" },
  { id: "music", icon: IconMusicNotes, label: "Musique", bgColor: "#14b8a6" },
  { id: "health", icon: IconHeart, label: "Santé", bgColor: "#be185d" },
  { id: "work", icon: IconBriefcase, label: "Travail", bgColor: "#525252" },
  { id: "grad", icon: IconGraduationCap, label: "Études", bgColor: "#075985" },
  { id: "gift", icon: IconGift, label: "Cadeau", bgColor: "#ca8a04" },
  { id: "chart", icon: IconChartBar, label: "Invest", bgColor: "#065F46" },
  { id: "buildings", icon: IconBuildings, label: "Immo", bgColor: "#404040" },
  { id: "fuel", icon: IconGasPump, label: "Carburant", bgColor: "#b45309" },
  { id: "phone", icon: IconDeviceMobile, label: "Mobile", bgColor: "#4B5563" },
  { id: "cat", icon: IconPawPrint, label: "Perso", bgColor: "#7c3aed" },
  { id: "dots", icon: IconDotsThreeOutline, label: "Autre", bgColor: "#737373" },
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
