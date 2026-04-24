const getItemsNeedingCook = (sale) => {
  if (!sale.items) return [];
  return sale.items
    .map((item, index) => ({ itemIndex: index, item }))
    .filter(({ item }) => item.units && item.units.length > 0);
};

const updateUnitCookLevel = (sale, itemIndex, unitIndex, cookLevel) => {
  if (!sale.items || !sale.items[itemIndex]) return sale;
  const newItems = sale.items.map((item, idx) => {
    if (idx !== itemIndex) return item;
    const newUnits = (item.units || []).map((u, uIdx) =>
      uIdx !== unitIndex ? u : { ...u, cookLevel }
    );
    return { ...item, units: newUnits };
  });
  return { ...sale, items: newItems };
};

const areAllUnitsCooked = (sale) => {
  const needsCook = getItemsNeedingCook(sale);
  if (needsCook.length === 0) return true;
  return needsCook.every(({ item }) =>
    item.units.every(u => u.cookLevel != null && u.cookLevel !== '')
  );
};

module.exports = { getItemsNeedingCook, updateUnitCookLevel, areAllUnitsCooked };
