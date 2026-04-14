const { buildPrincipalMode } = require('../models/mode');
const { attachEnvelope } = require('./entityEnvelope');

const migrateToV5 = ({ products = [], tabs = [], existingModes = [], deviceId }) => {
  if (existingModes.length > 0) {
    return { modes: existingModes, currentModeId: null };
  }
  const principal = buildPrincipalMode({ products, tabs });
  const enveloped = attachEnvelope(principal, { deviceId });
  return { modes: [enveloped], currentModeId: enveloped.id };
};

module.exports = { migrateToV5 };
