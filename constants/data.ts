import { CategoryType, ExpenseCategoriesType } from "@/types";
import { CarIcon as IconCar } from "phosphor-react-native/src/icons/Car";
import { CurrencyDollarSimpleIcon as IconCurrencyDollarSimple } from "phosphor-react-native/src/icons/CurrencyDollarSimple";
import { DotsThreeOutlineIcon as IconDotsThreeOutline } from "phosphor-react-native/src/icons/DotsThreeOutline";
import { FilmStripIcon as IconFilmStrip } from "phosphor-react-native/src/icons/FilmStrip";
import { ForkKnifeIcon as IconForkKnife } from "phosphor-react-native/src/icons/ForkKnife";
import { HeartIcon as IconHeart } from "phosphor-react-native/src/icons/Heart";
import { HouseIcon as IconHouse } from "phosphor-react-native/src/icons/House";
import { LightbulbIcon as IconLightbulb } from "phosphor-react-native/src/icons/Lightbulb";
import { PiggyBankIcon as IconPiggyBank } from "phosphor-react-native/src/icons/PiggyBank";
import { ShieldCheckIcon as IconShieldCheck } from "phosphor-react-native/src/icons/ShieldCheck";
import { ShoppingCartIcon as IconShoppingCart } from "phosphor-react-native/src/icons/ShoppingCart";
import { TShirtIcon as IconTShirt } from "phosphor-react-native/src/icons/TShirt";
import { UserIcon as IconUser } from "phosphor-react-native/src/icons/User";

export const expenseCategories: ExpenseCategoriesType = {
  groceries: {
    label: "Groceries",
    value: "groceries",
    icon: IconShoppingCart,
    bgColor: "#4B5563", // Deep Teal Green
  },
  rent: {
    label: "Rent",
    value: "rent",
    icon: IconHouse,
    bgColor: "#075985", // Dark Blue
  },
  utilities: {
    label: "Utilities",
    value: "utilities",
    icon: IconLightbulb,
    bgColor: "#ca8a04", // Dark Golden Brown
  },
  transportation: {
    label: "Transportation",
    value: "transportation",
    icon: IconCar,
    bgColor: "#b45309", // Dark Orange-Red
  },
  entertainment: {
    label: "Entertainment",
    value: "entertainment",
    icon: IconFilmStrip,
    bgColor: "#0f766e", // Darker Red-Brown
  },
  dining: {
    label: "Dining",
    value: "dining",
    icon: IconForkKnife,
    bgColor: "#be185d", // Dark Red
  },
  health: {
    label: "Health",
    value: "health",
    icon: IconHeart,
    bgColor: "#e11d48", // Dark Purple
  },
  insurance: {
    label: "Insurance",
    value: "insurance",
    icon: IconShieldCheck,
    bgColor: "#404040", // Dark Gray
  },
  savings: {
    label: "Savings",
    value: "savings",
    icon: IconPiggyBank,
    bgColor: "#065F46", // Deep Teal Green
  },
  clothing: {
    label: "Clothing",
    value: "clothing",
    icon: IconTShirt,
    bgColor: "#7c3aed", // Dark Indigo
  },
  personal: {
    label: "Personal",
    value: "personal",
    icon: IconUser,
    bgColor: "#a21caf", // Deep Pink
  },
  others: {
    label: "Others",
    value: "others",
    icon: IconDotsThreeOutline,
    bgColor: "#525252", // Neutral Dark Gray
  },
};

export const incomeCategory: CategoryType = {
  label: "Income",
  value: "income",
  icon: IconCurrencyDollarSimple,
  bgColor: "#16a34a", // Dark
};

export const transactionTypes = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
];

export const getTransactionTypes = (t: (k:string)=>string) => [
  { label: t("expense"), value: "expense" },
  { label: t("income"), value: "income" },
];

export const getExpenseCategories = (t: (k:string)=>string): ExpenseCategoriesType => ({
  groceries: { label: t("groceries"), value: "groceries", icon: expenseCategories.groceries.icon, bgColor: expenseCategories.groceries.bgColor },
  rent: { label: t("rent"), value: "rent", icon: expenseCategories.rent.icon, bgColor: expenseCategories.rent.bgColor },
  utilities: { label: t("utilitiesCat"), value: "utilities", icon: expenseCategories.utilities.icon, bgColor: expenseCategories.utilities.bgColor },
  transportation: { label: t("transportation"), value: "transportation", icon: expenseCategories.transportation.icon, bgColor: expenseCategories.transportation.bgColor },
  entertainment: { label: t("entertainment"), value: "entertainment", icon: expenseCategories.entertainment.icon, bgColor: expenseCategories.entertainment.bgColor },
  dining: { label: t("dining"), value: "dining", icon: expenseCategories.dining.icon, bgColor: expenseCategories.dining.bgColor },
  health: { label: t("health"), value: "health", icon: expenseCategories.health.icon, bgColor: expenseCategories.health.bgColor },
  insurance: { label: t("insurance"), value: "insurance", icon: expenseCategories.insurance.icon, bgColor: expenseCategories.insurance.bgColor },
  savings: { label: t("savings"), value: "savings", icon: expenseCategories.savings.icon, bgColor: expenseCategories.savings.bgColor },
  clothing: { label: t("clothing"), value: "clothing", icon: expenseCategories.clothing.icon, bgColor: expenseCategories.clothing.bgColor },
  personal: { label: t("personal"), value: "personal", icon: expenseCategories.personal.icon, bgColor: expenseCategories.personal.bgColor },
  others: { label: t("others"), value: "others", icon: expenseCategories.others.icon, bgColor: expenseCategories.others.bgColor },
});

export const getIncomeCategory = (t: (k:string)=>string): CategoryType => ({
  label: t("income"),
  value: "income",
  icon: incomeCategory.icon,
  bgColor: incomeCategory.bgColor,
});
