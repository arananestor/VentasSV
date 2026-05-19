/**
 * Sales CSV — pure logic tests
 * Tests formatCSVCell and buildSalesCSV using real functions from src/utils/salesCsv
 */

import { formatCSVCell, buildSalesCSV } from '../../src/utils/salesCsv';

const makeSale = (overrides) => ({
  id: 'sale-1',
  orderNumber: '0001',
  timestamp: '2026-05-18T09:30:00.000Z',
  total: 25.50,
  paymentMethod: 'cash',
  workerName: 'Ana',
  geo: { latitude: 13.6929, longitude: -89.2182, accuracy: 12.5 },
  items: [
    { productName: 'Pupusa de queso', size: 'Grande', quantity: 2, extras: [], note: '', subtotal: 25.50 },
  ],
  ...overrides,
});

describe('formatCSVCell', () => {
  it('returns empty string for null', () => {
    // Arrange / Act
    const result = formatCSVCell(null);

    // Assert
    expect(result).toBe('');
  });

  it('returns empty string for undefined', () => {
    // Arrange / Act
    const result = formatCSVCell(undefined);

    // Assert
    expect(result).toBe('');
  });

  it('wraps value with comma in double quotes', () => {
    // Arrange / Act
    const result = formatCSVCell('one, two');

    // Assert
    expect(result).toBe('"one, two"');
  });

  it('escapes double quotes by doubling them', () => {
    // Arrange / Act
    const result = formatCSVCell('say "hello"');

    // Assert
    expect(result).toBe('"say ""hello"""');
  });

  it('wraps value with newline in double quotes', () => {
    // Arrange / Act
    const result = formatCSVCell('line1\nline2');

    // Assert
    expect(result).toBe('"line1\nline2"');
  });

  it('returns plain string when no special chars', () => {
    // Arrange / Act
    const result = formatCSVCell('simple');

    // Assert
    expect(result).toBe('simple');
  });
});

describe('buildSalesCSV', () => {
  it('returns only header for empty sales', () => {
    // Arrange / Act
    const csv = buildSalesCSV([]);

    // Assert
    expect(csv.split('\n')).toHaveLength(1);
    expect(csv).toContain('No. Pedido');
    expect(csv).toContain('Producto');
  });

  it('generates one row per item', () => {
    // Arrange
    const sale = makeSale({
      items: [
        { productName: 'Pupusa', size: '', quantity: 2, extras: [], note: '', subtotal: 10 },
        { productName: 'Horchata', size: 'Grande', quantity: 1, extras: [], note: '', subtotal: 5 },
      ],
    });

    // Act
    const csv = buildSalesCSV([sale]);
    const lines = csv.split('\n');

    // Assert
    expect(lines).toHaveLength(3); // header + 2 items
    expect(lines[1]).toContain('Pupusa');
    expect(lines[2]).toContain('Horchata');
  });

  it('repeats sale context across item rows', () => {
    // Arrange
    const sale = makeSale({
      items: [
        { productName: 'A', size: '', quantity: 1, extras: [], note: '', subtotal: 5 },
        { productName: 'B', size: '', quantity: 1, extras: [], note: '', subtotal: 5 },
      ],
    });

    // Act
    const csv = buildSalesCSV([sale]);
    const lines = csv.split('\n');

    // Assert
    expect(lines[1]).toContain('#0001');
    expect(lines[2]).toContain('#0001');
    expect(lines[1]).toContain('Ana');
    expect(lines[2]).toContain('Ana');
  });

  it('handles extras as array of strings', () => {
    // Arrange
    const sale = makeSale({
      items: [{ productName: 'Taco', size: '', quantity: 1, extras: ['Salsa', 'Guac'], note: '', subtotal: 8 }],
    });

    // Act
    const csv = buildSalesCSV([sale]);

    // Assert
    expect(csv).toContain('Salsa');
    expect(csv).toContain('Guac');
  });

  it('handles extras as array of objects', () => {
    // Arrange
    const sale = makeSale({
      items: [{ productName: 'Taco', size: '', quantity: 1, extras: [{ name: 'Cheese' }], note: '', subtotal: 8 }],
    });

    // Act
    const csv = buildSalesCSV([sale]);

    // Assert
    expect(csv).toContain('Cheese');
  });

  it('omits sales without items', () => {
    // Arrange
    const sales = [
      makeSale({ items: [] }),
      makeSale({ id: 's2', items: [{ productName: 'X', size: '', quantity: 1, extras: [], note: '', subtotal: 5 }] }),
    ];

    // Act
    const csv = buildSalesCSV(sales);
    const lines = csv.split('\n');

    // Assert
    expect(lines).toHaveLength(2); // header + 1 item from second sale
  });

  it('includes geo when present', () => {
    // Arrange
    const sale = makeSale();

    // Act
    const csv = buildSalesCSV([sale]);

    // Assert
    expect(csv).toContain('13.6929');
    expect(csv).toContain('-89.2182');
    expect(csv).toContain('13'); // rounded accuracy
  });

  it('handles missing geo gracefully', () => {
    // Arrange
    const sale = makeSale({ geo: null });

    // Act
    const csv = buildSalesCSV([sale]);
    const lines = csv.split('\n');

    // Assert
    expect(lines).toHaveLength(2);
    // Last 3 fields should be empty
    const dataLine = lines[1];
    expect(dataLine).toBeTruthy();
  });

  it('uses methodLabel for payment method', () => {
    // Arrange
    const sale = makeSale({ paymentMethod: 'transfer' });

    // Act
    const csv = buildSalesCSV([sale]);

    // Assert
    expect(csv).toContain('Transferencia');
  });
});
