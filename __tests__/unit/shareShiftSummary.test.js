/**
 * Share shift summary — pure logic tests
 * Tests formatShiftSummaryMessage using real function from src/utils/shareShiftSummary
 */

import { formatShiftSummaryMessage } from '../../src/utils/shareShiftSummary';

const worker = { name: 'Ana García', puesto: 'Cajero' };
const businessName = 'Pupusería Don Carlos';

const makeSale = (overrides) => ({
  id: 'sale1',
  orderNumber: '0001',
  timestamp: '2026-05-18T09:30:00.000Z',
  total: 25.50,
  paymentMethod: 'cash',
  items: [
    { product: { name: 'Pupusa de queso' }, size: { name: 'Grande' }, quantity: 2, extras: [], note: '' },
  ],
  ...overrides,
});

const makeSummary = (overrides) => ({
  durationMs: 12240000,
  durationLabel: '3h 24min',
  ticketCount: 2,
  total: 45.50,
  byMethod: { cash: 25.50, card: 20 },
  productsSummary: [
    { name: 'Pupusa de queso', units: 4 },
    { name: 'Horchata', units: 2 },
  ],
  shiftSales: [
    makeSale(),
    makeSale({ id: 'sale2', orderNumber: '0002', timestamp: '2026-05-18T10:15:00.000Z', total: 20, paymentMethod: 'card', items: [
      { product: { name: 'Horchata' }, quantity: 2, extras: [{ name: 'Canela extra' }], note: 'Bien fría' },
    ]}),
  ],
  ...overrides,
});

describe('formatShiftSummaryMessage', () => {
  it('starts with VENTASSV title', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, businessName);

    // Assert
    expect(msg).toContain('VENTASSV');
  });

  it('includes business name when provided', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, businessName);

    // Assert
    expect(msg).toContain('Negocio: Pupusería Don Carlos');
  });

  it('includes worker name and puesto', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Empleado: Ana García · Cajero');
  });

  it('includes total formatted with $ and two decimals', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Total turno: $45.50');
  });

  it('includes ticket count', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Tickets: 2');
  });

  it('lists payment methods with labels and amounts', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Efectivo: $25.50');
    expect(msg).toContain('Tarjeta: $20.00');
  });

  it('includes ticket detail with order number', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Ticket #0001');
    expect(msg).toContain('Ticket #0002');
  });

  it('includes item details with quantity and product name', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('2x Pupusa de queso');
  });

  it('includes extras in ticket items', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('+ Canela extra');
  });

  it('includes notes in ticket items', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Nota: Bien fría');
  });

  it('includes ALL products in MAS VENDIDOS section, not just top 3', () => {
    // Arrange
    const summary = makeSummary({
      productsSummary: [
        { name: 'A', units: 10 }, { name: 'B', units: 8 },
        { name: 'C', units: 5 }, { name: 'D', units: 3 },
      ],
    });

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('MAS VENDIDOS');
    expect(msg).toContain('10x A');
    expect(msg).toContain('8x B');
    expect(msg).toContain('5x C');
    expect(msg).toContain('3x D');
  });

  it('omits MAS VENDIDOS if productsSummary is empty', () => {
    // Arrange
    const summary = makeSummary({ productsSummary: [] });

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).not.toContain('MAS VENDIDOS');
  });

  it('shows "Sin ventas" when ticketCount is 0', () => {
    // Arrange
    const summary = makeSummary({ ticketCount: 0, shiftSales: [] });

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Sin ventas registradas en este turno');
  });

  it('contains no emojis', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, businessName);

    // Assert
    const emojiRegex = /[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/u;
    expect(emojiRegex.test(msg)).toBe(false);
  });
});
