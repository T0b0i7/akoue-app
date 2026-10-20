// Windows EMFILE : on plafonne les workers sans tomber à 2 (2 = bundling TRÈS lent).
const os = require("os");
const { getDefaultConfig } = require("expo/metro-config");

const cpus = os.cpus()?.length || 4;
// Défaut : 4 workers (bon compromis Windows). Surcharge : METRO_MAX_WORKERS=6 npx expo start
const maxWorkers = Number(process.env.METRO_MAX_WORKERS) || Math.min(4, Math.max(2, cpus - 1));

const config = getDefaultConfig(__dirname);
config.maxWorkers = maxWorkers;
module.exports = config;
