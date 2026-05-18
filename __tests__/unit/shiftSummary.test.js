/**
 * Shift summary — pure logic tests
 * Tests computeShiftSummary using real function from src/utils/shiftSummary
 */

import { computeShiftSummary } from '../../src/utils/shiftSummary';

const BASE_TIME = '2026-05-18T08:00:00.000Z';
const LATER_TIME = '2026-05-18T11:24:00.000Z'; // 3h 24min later

const makeSale = (overrides) => ({
  timestamp: '2026-05-18T09:00:00.000Z',
  total: 10,
  paymentMethod: 'cash',
  workerId: 'w1',
  items: [{ product: { name: 'Pupusa' }, units: [{}], quantity: 1 }],
  ...overrides,
});

describe('computeShiftSummary', () => {
  it('shiftStartedAt null returns all empty/zero', () => {
    // Arrange
    const input = { shiftStartedAt: null, sales: [makeSale()], workerId: 'w1' };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.durationMs).toBeNull();
    expect(result.durationLabel).toBe('—');
    expect(result.ticketCount).toBe(0);
    expect(result.total).toBe(0);
    expect(result.byMethod).toEqual({});
    expect(result.topProducts).toEqual([]);
  });

  it('excludes sales before shift start', () => {
    // Arrange
    const input = {
      shiftStartedAt: '2026-05-18T10:00:00.000Z',
      sales: [makeSale({ timestamp: '2026-05-18T09:00:00.000Z', total: 5 })],
      workerId: 'w1',
      now: LATER_TIME,
    };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.ticketCount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('includes sales without workerId if timestamp is in range', () => {
    // Arrange
    const input = {
      shiftStartedAt: BASE_TIME,
      sales: [makeSale({ workerId: undefined, timestamp: '2026-05-18T09:30:00.000Z', total: 15 })],
      workerId: 'w1',
      now: LATER_TIME,
    };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.ticketCount).toBe(1);
    expect(result.total).toBe(15);
  });

  it('excludes sales from another workerId', () => {
    // Arrange
    const input = {
      shiftStartedAt: BASE_TIME,
      sales: [makeSale({ workerId: 'other', timestamp: '2026-05-18T09:30:00.000Z', total: 20 })],
      workerId: 'w1',
      now: LATER_TIME,
    };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.ticketCount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('groups byMethod correctly and sums totals', () => {
    // Arrange
    const sales = [
      makeSale({ paymentMethod: 'cash', total: 10 }),
      makeSale({ paymentMethod: 'card', total: 25 }),
      makeSale({ paymentMethod: 'cash', total: 15 }),
    ];
    const input = { shiftStartedAt: BASE_TIME, sales, workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.byMethod).toEqual({ cash: 25, card: 25 });
    expect(result.total).toBe(50);
  });

  it('topProducts sorts descending by units and limits to 3', () => {
    // Arrange
    const sales = [
      makeSale({ items: [
        { product: { name: 'A' }, units: [{}, {}], quantity: 2 },
        { product: { name: 'B' }, units: [{}], quantity: 1 },
      ]}),
      makeSale({ items: [
        { product: { name: 'C' }, units: [{}, {}, {}], quantity: 3 },
        { product: { name: 'D' }, units: [{}, {}, {}, {}], quantity: 4 },
        { product: { name: 'A' }, units: [{}, {}], quantity: 2 },
      ]}),
    ];
    const input = { shiftStartedAt: BASE_TIME, sales, workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.topProducts).toHaveLength(3);
    expect(result.topProducts[0].units).toBeGreaterThanOrEqual(result.topProducts[1].units);
    expect(result.topProducts[1].units).toBeGreaterThanOrEqual(result.topProducts[2].units);
    expect(result.topProducts[0].units).toBe(4);
    expect(result.topProducts[2].units).toBe(3);
    const names = result.topProducts.map(p => p.name);
    expect(names).toContain('A');
    expect(names).toContain('D');
  });

  it('durationLabel formats hours and minutes for >= 1 hour', () => {
    // Arrange
    const input = { shiftStartedAt: BASE_TIME, sales: [], workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.durationLabel).toBe('3h 24min');
  });

  it('durationLabel formats minutes only for < 1 hour', () => {
    // Arrange
    const input = {
      shiftStartedAt: '2026-05-18T10:00:00.000Z',
      sales: [],
      workerId: 'w1',
      now: '2026-05-18T10:45:00.000Z',
    };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.durationLabel).toBe('45min');
  });

  it('durationMs is correct millisecond difference', () => {
    // Arrange
    const input = { shiftStartedAt: BASE_TIME, sales: [], workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.durationMs).toBe(3 * 60 * 60 * 1000 + 24 * 60 * 1000);
  });
});
