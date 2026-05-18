/**
 * Share shift summary — pure logic tests
 * Tests formatShiftSummaryMessage using real function from src/utils/shareShiftSummary
 */

import { formatShiftSummaryMessage } from '../../src/utils/shareShiftSummary';

const worker = { name: 'Ana García' };
const businessName = 'Pupusería Don Carlos';

const makeSummary = (overrides) => ({
  durationMs: 12240000,
  durationLabel: '3h 24min',
  ticketCount: 5,
  total: 125.50,
  byMethod: { cash: 75.50, card: 50 },
  topProducts: [
    { name: 'Pupusa de queso', units: 8 },
    { name: 'Horchata', units: 4 },
  ],
  ...overrides,
});

describe('formatShiftSummaryMessage', () => {
  it('includes worker name', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, businessName);

    // Assert
    expect(msg).toContain('Ana García');
  });

  it('includes business name when provided', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, businessName);

    // Assert
    expect(msg).toContain('Pupusería Don Carlos');
  });

  it('includes total formatted with $ and two decimals', () => {
    // Arrange
    const summary = makeSummary({ total: 125.5 });

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('$125.50');
  });

  it('includes payment methods with labels and amounts', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Efectivo');
    expect(msg).toContain('$75.50');
    expect(msg).toContain('Tarjeta');
    expect(msg).toContain('$50.00');
  });

  it('includes top products with names and units', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Pupusa de queso');
    expect(msg).toContain('x8');
    expect(msg).toContain('Horchata');
    expect(msg).toContain('x4');
  });

  it('shows "Sin ventas" message when ticketCount is 0', () => {
    // Arrange
    const summary = makeSummary({ ticketCount: 0 });

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('Sin ventas registradas en este turno');
  });

  it('includes duration label', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).toContain('3h 24min');
  });

  it('omits business name line when not provided', () => {
    // Arrange
    const summary = makeSummary();

    // Act
    const msg = formatShiftSummaryMessage(summary, worker, null);

    // Assert
    expect(msg).not.toContain('Pupusería Don Carlos');
    expect(msg.startsWith('Resumen de turno')).toBe(true);
  });
});
