const { newId } = require('../utils/ids');

const createMode = ({
  name = '',
  description = '',
  productOverrides = {},
  tabOrder = [],
  isDefault = false,
  scheduledActivations = [],
} = {}) => ({
  id: newId(),
  name,
  description,
  productOverrides,
  tabOrder,
  isDefault,
  scheduledActivations,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const normalizeProductOverrides = (overrides) => {
  if (!overrides || typeof overrides !== 'object') return {};
  const result = {};
  for (const [key, val] of Object.entries(overrides)) {
    if (!val || typeof val !== 'object') continue;
    if (typeof val.active !== 'boolean') continue;
    const po = val.priceOverride;
    if (po !== null && typeof po !== 'number') continue;
    result[key] = { active: val.active, priceOverride: po };
  }
  return result;
};

const buildPrincipalMode = ({ products = [], tabs = [] } = {}) => {
  const productOverrides = {};
  products.forEach(p => {
    productOverrides[p.id] = { active: true, priceOverride: null };
  });
  return createMode({
    name: 'Principal',
    isDefault: true,
    productOverrides,
    tabOrder: tabs.map(t => t.id),
  });
};

module.exports = { createMode, normalizeProductOverrides, buildPrincipalMode };
