import { CURRENCY_CONFIG } from "@/config/currency-exchange-api";
import { CurrencyApiResponse, CurrencyType } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENCY_CACHE_KEY = "currency_rates";
const CURRENCY_CACHE_TTL = 60 * 60 * 1000; // 1 heure

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

const sanitizeCurrencyCode = (code: string): string => {
  const c = String(code || "EUR").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  if (!c || c.length !== 3) throw new Error("Devise invalide");
  if (!currencyMap[c] && !["EUR","USD","XOF","XAF","GBP","JPY","CNY","CAD","CHF","MAD","NGN","GHS","VND","KRW","INR","AUD","HKD","IDR","MYR","PHP","RUB","SAR","SEK"].includes(c)) {
    // whitelist stricte des devises supportées
    throw new Error(`Devise non supportée: ${c}`);
  }
  return c;
};

export const fetchCurrencies = async (
  base_currency: string
): Promise<CurrencyType[]> => {
  try {
    const safeBase = sanitizeCurrencyCode(base_currency || "EUR");
    
    // Vérifier le cache local (valide 1h)
    try {
      const cached = await AsyncStorage.getItem(CURRENCY_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CURRENCY_CACHE_TTL) {
          return data;
        }
      }
    } catch {}

    // Si config manquante, fallback sur Frankfurter (gratuit, sans clé) + open.er-api
    const hasConfig = !!CURRENCY_CONFIG.API_URL && !!CURRENCY_CONFIG.API_KEY;
    if (!hasConfig) {
      const base = safeBase;
      // Frankfurter supporte EUR base uniquement pour la version gratuite → on utilise open.er-api pour autres bases
      const url = base === "EUR"
        ? `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`
        : `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
      const res = await fetch(url);
      const json: any = await res.json();
      // Normalise les deux formats
      const rates: Record<string, number> = json.rates || json.data || {};
      // open.er-api met dans json.rates, frankfurter aussi
      if (!rates || Object.keys(rates).length === 0) throw new Error("Aucun taux reçu");
      const result = Object.entries(rates).map(([code, value]) => ({
        code,
        value: Number(value),
        name: currencyMap[code] || code,
      }));
      // Mettre en cache
      try {
        await AsyncStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch {}
      return result;
    }
    const currencies = CURRENCY_CONFIG.currencies || FALLBACK_CURRENCIES;
    const url = safeBase
      ? `${CURRENCY_CONFIG.API_URL}apikey=${encodeURIComponent(String(CURRENCY_CONFIG.API_KEY))}&currencies=${encodeURIComponent(String(currencies))}&base_currency=${encodeURIComponent(String(safeBase))}`
      : `${CURRENCY_CONFIG.API_URL}apikey=${encodeURIComponent(String(CURRENCY_CONFIG.API_KEY))}&currencies=${encodeURIComponent(String(currencies))}`;
    const response = await fetch(url);
    const data: CurrencyApiResponse = await response.json();
    // @ts-ignore currencyapi renvoie {data:{USD:{code, value}}}
    if ((data as any).data) {
      const result = transformCurrencyData(data);
      try {
        await AsyncStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch {}
      return result;
    }
    // Fallback si API renvoie déjà {rates:{USD:1.2}}
    const rates2: any = (data as any).rates || (data as any).data;
    if (rates2) {
      const result = Object.entries(rates2).map(([code, v]: any) => ({
        code,
        value: typeof v === "number" ? v : v.value,
        name: currencyMap[code] || code,
      }));
      try {
        await AsyncStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
      } catch {}
      return result;
    }
    return [];
  } catch {
    // Fallback statique pour que le select ne soit jamais vide (même hors ligne)
    const fallbackRates: Record<string, number> = {
      EUR: 1, USD: 1.09, XOF: 655.96, XAF: 655.96, GBP: 0.85, JPY: 165, CNY: 7.85, CAD: 1.47, CHF: 0.95, MAD: 10.8, NGN: 1650, GHS: 16.5, VND: 27000, KRW: 1450, INR: 90,
    };
    let baseSafe: string = "EUR";
    try { baseSafe = sanitizeCurrencyCode(base_currency || "EUR"); } catch { baseSafe = "EUR"; }
    const base = baseSafe || "EUR";
    const baseRate = fallbackRates[base] || 1;
    return Object.entries(fallbackRates)
      .filter(([code]) => code !== base)
      .map(([code, rate]) => ({
        code,
        value: Number((rate / baseRate).toFixed(6)),
        name: currencyMap[code] || code,
      }));
  }
};
