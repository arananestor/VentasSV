const migrateBusinessConfigToQentasFields = (config) => {
  if (!config) return config;
  return {
    ...config,
    qentasConnected: config.qentasConnected ?? false,
    qentasAccountId: config.qentasAccountId ?? null,
  };
};

module.exports = { migrateBusinessConfigToQentasFields };
