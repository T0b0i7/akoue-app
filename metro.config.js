// Fix Windows EMFILE: limite les workers Metro qui ouvrent trop de fichiers en parallèle.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.maxWorkers = 2;
module.exports = config;
