import { CategoryType, ExpenseCategoriesType } from "@/types";
import * as Icons from "phosphor-react-native";

export const expenseCategories: ExpenseCategoriesType = {
  groceries: {
    label: "Groceries",
    value: "groceries",
    icon: Icons.ShoppingCart,
    bgColor: "#4B5563", // Deep Teal Green
  },
  rent: {
    label: "Rent",
    value: "rent",
    icon: Icons.House,
    bgColor: "#075985", // Dark Blue
  },
  utilities: {
    label: "Utilities",
    value: "utilities",
    icon: Icons.Lightbulb,
    bgColor: "#ca8a04", // Dark Golden Brown
  },
  transportation: {
    label: "Transportation",
    value: "transportation",
    icon: Icons.Car,
    bgColor: "#b45309", // Dark Orange-Red
  },
  entertainment: {
    label: "Entertainment",
    value: "entertainment",
    icon: Icons.FilmStrip,
    bgColor: "#0f766e", // Darker Red-Brown
  },
  dining: {
    label: "Dining",
    value: "dining",
    icon: Icons.ForkKnife,
    bgColor: "#be185d", // Dark Red
  },
  health: {
    label: "Health",
    value: "health",
    icon: Icons.Heart,
    bgColor: "#e11d48", // Dark Purple
  },
  insurance: {
    label: "Insurance",
    value: "insurance",
    icon: Icons.ShieldCheck,
    bgColor: "#404040", // Dark Gray
  },
  savings: {
    label: "Savings",
    value: "savings",
    icon: Icons.PiggyBank,
    bgColor: "#065F46", // Deep Teal Green
  },
  clothing: {
    label: "Clothing",
    value: "clothing",
    icon: Icons.TShirt,
    bgColor: "#7c3aed", // Dark Indigo
  },
  personal: {
    label: "Personal",
    value: "personal",
    icon: Icons.User,
    bgColor: "#a21caf", // Deep Pink
  },
  others: {
    label: "Others",
    value: "others",
    icon: Icons.DotsThreeOutline,
    bgColor: "#525252", // Neutral Dark Gray
  },
};

export const incomeCategory: CategoryType = {
  label: "Income",
  value: "income",
  icon: Icons.CurrencyDollarSimple,
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
