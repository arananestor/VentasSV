const resolveVisibleProducts = (products, mode) => {
  if (!mode || !mode.productOverrides) return products;
  return products.filter(p => {
    const override = mode.productOverrides[p.id];
    return override && override.active === true;
  });
};

const resolveProductPrice = (product, sizeIndex, mode) => {
  const basePrice = product.sizes?.[sizeIndex]?.price || 0;
  if (!mode || !mode.productOverrides) return basePrice;
  const override = mode.productOverrides[product.id];
  if (!override || override.priceOverride == null || typeof override.priceOverride !== 'number') return basePrice;
  if (!isFinite(override.priceOverride)) return basePrice;
  if (product.sizes.length !== 1) return basePrice;
  return override.priceOverride;
};

const resolveTabOrder = (tabs, mode) => {
  if (!mode || !mode.tabOrder || mode.tabOrder.length === 0) return tabs;
  const ordered = [];
  mode.tabOrder.forEach(tabId => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) ordered.push(tab);
  });
  tabs.forEach(t => {
    if (!ordered.find(o => o.id === t.id)) ordered.push(t);
  });
  return ordered;
};

module.exports = { resolveVisibleProducts, resolveProductPrice, resolveTabOrder };
