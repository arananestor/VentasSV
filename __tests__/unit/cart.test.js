import {
  calculateCartTotal,
  cartCount,
  addItemToCart,
  removeItemFromCart,
  clearCart,
} from '../../src/utils/cartLogic';

const mockCart = [
  { cartId: '1', product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal', price: 0.50 }, quantity: 2, total: 1.00 },
  { cartId: '2', product: { id: 'p2', name: 'Minuta' }, size: { name: 'Grande', price: 1.50 }, quantity: 1, total: 1.50 },
  { cartId: '3', product: { id: 'p3', name: 'Tamal' }, size: { name: 'Normal', price: 0.75 }, quantity: 3, total: 2.25 },
];

describe('calculateCartTotal', () => {
  it('suma correctamente todos los items', () => {
    // Arrange
    const cart = mockCart;

    // Act
    const total = calculateCartTotal(cart);

    // Assert
    expect(total).toBeCloseTo(4.75);
  });

  it('retorna 0 con carrito vacío', () => {
    // Arrange
    const cart = [];

    // Act
    const total = calculateCartTotal(cart);

    // Assert
    expect(total).toBe(0);
  });

  it('maneja punto flotante correctamente', () => {
    // Arrange
    const cart = [
      { cartId: 'a', total: 0.10 },
      { cartId: 'b', total: 0.20 },
    ];

    // Act
    const total = calculateCartTotal(cart);

    // Assert
    expect(parseFloat(total.toFixed(2))).toBe(0.30);
  });

  it('un solo item', () => {
    // Arrange
    const cart = [{ cartId: 'x', total: 3.75 }];

    // Act
    const total = calculateCartTotal(cart);

    // Assert
    expect(total).toBe(3.75);
  });
});

describe('cartCount', () => {
  it('retorna el número correcto de items', () => {
    // Arrange
    const cart = mockCart;

    // Act
    const count = cartCount(cart);

    // Assert
    expect(count).toBe(3);
  });

  it('retorna 0 para carrito vacío', () => {
    // Arrange
    const cart = [];

    // Act
    const count = cartCount(cart);

    // Assert
    expect(count).toBe(0);
  });

  it('retorna 1 para un solo item', () => {
    // Arrange
    const cart = [mockCart[0]];

    // Act
    const count = cartCount(cart);

    // Assert
    expect(count).toBe(1);
  });
});

describe('addItemToCart', () => {
  it('agrega item al carrito', () => {
    // Arrange
    const cart = [];
    const item = { product: { id: 'p1', name: 'Pupusa' }, size: { name: 'Normal', price: 0.50 }, quantity: 1, total: 0.50 };

    // Act
    const updated = addItemToCart(cart, item);

    // Assert
    expect(updated).toHaveLength(1);
  });

  it('no muta el carrito original', () => {
    // Arrange
    const cart = [...mockCart];
    const item = { product: { id: 'p99' }, total: 1.00 };

    // Act
    const updated = addItemToCart(cart, item);

    // Assert
    expect(cart).toHaveLength(3);
    expect(updated).toHaveLength(4);
  });

  it('el nuevo item tiene cartId generado', () => {
    // Arrange
    const cart = [];
    const item = { product: { id: 'p1' }, total: 1.00 };

    // Act
    const updated = addItemToCart(cart, item);

    // Assert
    expect(updated[0].cartId).toBeDefined();
    expect(typeof updated[0].cartId).toBe('string');
  });

  it('múltiples llamadas generan cartIds únicos', () => {
    // Arrange
    const cart = [];
    const item = { product: { id: 'p1' }, total: 1.00 };

    // Act
    const first = addItemToCart(cart, item);
    const second = addItemToCart(first, item);

    // Assert
    expect(second[0].cartId).not.toBe(second[1].cartId);
  });

  it('preserva todas las props del item original', () => {
    // Arrange
    const cart = [];
    const item = { product: { id: 'p5', name: 'Horchata' }, size: { name: 'Grande', price: 1.50 }, quantity: 2, total: 3.00 };

    // Act
    const updated = addItemToCart(cart, item);

    // Assert
    expect(updated[0].product.name).toBe('Horchata');
    expect(updated[0].total).toBe(3.00);
    expect(updated[0].quantity).toBe(2);
  });
});

describe('removeItemFromCart', () => {
  it('elimina solo el item correcto', () => {
    // Arrange
    const cart = mockCart;

    // Act
    const updated = removeItemFromCart(cart, '2');

    // Assert
    expect(updated).toHaveLength(2);
    expect(updated.find(i => i.cartId === '2')).toBeUndefined();
  });

  it('no modifica los demás items', () => {
    // Arrange
    const cart = mockCart;

    // Act
    const updated = removeItemFromCart(cart, '2');

    // Assert
    expect(updated[0].cartId).toBe('1');
    expect(updated[1].cartId).toBe('3');
  });

  it('no muta el carrito original', () => {
    // Arrange
    const cart = [...mockCart];

    // Act
    const updated = removeItemFromCart(cart, '1');

    // Assert
    expect(cart).toHaveLength(3);
    expect(updated).toHaveLength(2);
  });

  it('retorna el mismo array si cartId no existe', () => {
    // Arrange
    const cart = mockCart;

    // Act
    const updated = removeItemFromCart(cart, 'inexistente');

    // Assert
    expect(updated).toHaveLength(3);
  });
});

describe('clearCart', () => {
  it('retorna un array vacío', () => {
    // Arrange / Act
    const result = clearCart();

    // Assert
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('siempre retorna vacío sin importar el estado previo', () => {
    // Arrange
    const bigCart = mockCart;

    // Act
    const result = clearCart(bigCart);

    // Assert
    expect(result).toHaveLength(0);
  });
});
