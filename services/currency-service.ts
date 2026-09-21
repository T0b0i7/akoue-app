import { CURRENCY_CONFIG } from "@/config/currency-exchange-api";
import { CurrencyApiResponse, CurrencyType } from "@/types";

const currencyMap: Record<string, string> = {
  VND: "Vietnamese Dong",
  USD: "United States Dollar",
  EUR: "Euro",
  XOF: "Franc CFA (BCEAO)",
  XAF: "Franc CFA (BEAC)",
  JPY: "Japanese Yen",
  KRW: "South Korean Won",
  CNY: "Chinese Yuan",
  SGD: "Singapore Dollar",
  THB: "Thai Baht",
  AUD: "Australian Dollar",
  HKD: "Hong Kong Dollar",
  INR: "Indian Rupee",
  IDR: "Indonesian Rupiah",
  MYR: "Malaysian Ringgit",
  PHP: "Philippine Peso",
  RUB: "Russian Ruble",
  SAR: "Saudi Riyal",
  SEK: "Swedish Krona",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  MAD: "Moroccan Dirham",
  NGN: "Nigerian Naira",
  GHS: "Ghanaian Cedi",
};

const FALLBACK_CURRENCIES = "USD,EUR,XOF,XAF,GBP,JPY,CNY,CAD,CHF,MAD,NGN,GHS,VND,KRW,INR";

export const transformCurrencyData = (
  response: CurrencyApiResponse
): CurrencyType[] => {
  const { data } = response;
  return Object.entries(data).map(([key, currency]) => ({
    code: currency.code,
    value: currency.value,
    name: currencyMap[key as keyof typeof currencyMap],
  }));
};

export const fetchCurrencies = async (
  base_currency: string
): Promise<CurrencyType[]> => {
  try {
    // Si config manquante, fallback sur Frankfurter (gratuit, sans clé) + open.er-api
    const hasConfig = !!CURRENCY_CONFIG.API_URL && !!CURRENCY_CONFIG.API_KEY;
    if (!hasConfig) {
      const base = base_currency || "EUR";
      // Frankfurter supporte EUR base uniquement pour la version gratuite → on utilise open.er-api pour autres bases
      const url = base === "EUR"
        ? `https://api.frankfurter.app/latest?from=${base}`
        : `https://open.er-api.com/v6/latest/${base}`;
      const res = await fetch(url);
      const json: any = await res.json();
      // Normalise les deux formats
      const rates: Record<string, number> = json.rates || json.data || {};
      // open.er-api met dans json.rates, frankfurter aussi
      if (!rates || Object.keys(rates).length === 0) throw new Error("Aucun taux reçu");
      return Object.entries(rates).map(([code, value]) => ({
        code,
        value: Number(value),
        name: currencyMap[code] || code,
      }));
    }
    const currencies = CURRENCY_CONFIG.currencies || FALLBACK_CURRENCIES;
    const url = base_currency
      ? `${CURRENCY_CONFIG.API_URL}apikey=${CURRENCY_CONFIG.API_KEY}&currencies=${currencies}&base_currency=${base_currency}`
      : `${CURRENCY_CONFIG.API_URL}apikey=${CURRENCY_CONFIG.API_KEY}&currencies=${currencies}`;
    const response = await fetch(url);
    const data: CurrencyApiResponse = await response.json();
    // @ts-ignore currencyapi renvoie {data:{USD:{code, value}}}
    if ((data as any).data) return transformCurrencyData(data);
    // Fallback si API renvoie déjà {rates:{USD:1.2}}
    const rates2: any = (data as any).rates || (data as any).data;
    if (rates2) {
      return Object.entries(rates2).map(([code, v]: any) => ({
        code,
        value: typeof v === "number" ? v : v.value,
        name: currencyMap[code] || code,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching currencies:", error);
    throw error;
  }
};
