const calculateCartTotal = (cart) => cart.reduce((sum, i) => sum + i.total, 0);

const cartCount = (cart) => cart.length;

const addItemToCart = (cart, item) => {
  const cartItem = { ...item, cartId: Date.now().toString() + '_' + Math.random() };
  return [...cart, cartItem];
};

const removeItemFromCart = (cart, cartId) => cart.filter(i => i.cartId !== cartId);

const clearCart = () => [];

module.exports = { calculateCartTotal, cartCount, addItemToCart, removeItemFromCart, clearCart };
