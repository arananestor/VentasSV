const migrateSaleV2toV3 = (oldSale) => {
  if (oldSale.items) return oldSale;

  const { productId, productName, size, quantity, units, extras, toppings, note, ...rest } = oldSale;

  return {
    ...rest,
    items: [{
      productId: productId || '',
      productName: productName || '',
      size: size || '',
      quantity: quantity || 1,
      units: units || [],
      extras: extras || toppings || [],
      note: note || '',
      subtotal: oldSale.total || 0,
    }],
    total: oldSale.total || 0,
  };
};

const migrateAllSalesV2toV3 = (sales) => sales.map(migrateSaleV2toV3);

module.exports = { migrateSaleV2toV3, migrateAllSalesV2toV3 };
