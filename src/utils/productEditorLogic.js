const cycleColor = (currentColor, colorArray) => {
  if (!colorArray || colorArray.length === 0) return currentColor;
  const idx = colorArray.indexOf(currentColor);
  if (idx < 0) return colorArray[0];
  return colorArray[(idx + 1) % colorArray.length];
};

const validateEditedProduct = (product) => {
  if (!product.name || !product.name.trim()) return { ok: false, error: 'El nombre no puede estar vacío' };
  const hasPrice = (product.sizes || []).some(s => s.price > 0);
  if (!hasPrice) return { ok: false, error: 'Agregá al menos un precio' };
  return { ok: true, error: null };
};

const buildEditedProduct = (original, edits) => {
  const result = { ...original, ...edits };
  if (original.type === 'simple') {
    delete result.ingredients;
    delete result.flavors;
    delete result.extras;
    delete result.toppings;
    delete result.maxIngredients;
    delete result.maxFlavors;
  }
  return result;
};

module.exports = { cycleColor, validateEditedProduct, buildEditedProduct };
