const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.resolve(__dirname, "..", "data");
const configPath = path.join(dataDir, "calculator-config.json");
const defaultConfigPath = path.join(dataDir, "calculator-config.default.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureConfigFile() {
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(configPath)) {
    fs.copyFileSync(defaultConfigPath, configPath);
  }
}

function validateConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Config must be a JSON object.");
  }

  const requiredObjects = ["units", "fullService", "aLaCarte", "quoteRequest"];
  requiredObjects.forEach((key) => {
    if (!config[key] || typeof config[key] !== "object") {
      throw new Error(`Config is missing ${key}.`);
    }
  });

  const requiredNumbers = [
    ["taxRate", config.taxRate],
    ["depositRate", config.depositRate],
    ["units.ouncesPerPound", config.units.ouncesPerPound],
    ["units.ouncesPerQuart", config.units.ouncesPerQuart],
    ["fullService.productionFeeRate", config.fullService.productionFeeRate],
    ["fullService.teamGuestsPerStaffMember", config.fullService.teamGuestsPerStaffMember],
    ["aLaCarte.pickupProductionFeeRate", config.aLaCarte.pickupProductionFeeRate],
    ["aLaCarte.dropoffProductionFeeRate", config.aLaCarte.dropoffProductionFeeRate]
  ];

  requiredNumbers.forEach(([label, value]) => {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      throw new Error(`${label} must be a number of 0 or greater.`);
    }
  });

  ["packages", "venueTypes"].forEach((key) => {
    if (!Array.isArray(config.fullService[key])) {
      throw new Error(`fullService.${key} must be an array.`);
    }
  });

  ["fulfillmentOptions", "meats", "sides", "desserts", "beverages"].forEach((key) => {
    if (!Array.isArray(config.aLaCarte[key])) {
      throw new Error(`aLaCarte.${key} must be an array.`);
    }
  });

  if (!Array.isArray(config.aLaCarte.pickupNoMinimumDays)) {
    throw new Error("aLaCarte.pickupNoMinimumDays must be an array.");
  }
}

function getDefaultCalculatorConfig() {
  return clone(readJson(defaultConfigPath));
}

function getCalculatorConfig() {
  ensureConfigFile();
  const config = readJson(configPath);
  validateConfig(config);
  return clone(config);
}

function saveCalculatorConfig(config) {
  validateConfig(config);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return getCalculatorConfig();
}

function resetCalculatorConfig() {
  const config = getDefaultCalculatorConfig();
  return saveCalculatorConfig(config);
}

module.exports = {
  configPath,
  getCalculatorConfig,
  getDefaultCalculatorConfig,
  saveCalculatorConfig,
  resetCalculatorConfig,
  validateConfig
};
