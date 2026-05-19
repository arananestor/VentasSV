/**
 * Shift summary — pure logic tests
 * Tests computeShiftSummary using real function from src/utils/shiftSummary
 */

import { computeShiftSummary } from '../../src/utils/shiftSummary';

const BASE_TIME = '2026-05-18T08:00:00.000Z';
const LATER_TIME = '2026-05-18T11:24:00.000Z'; // 3h 24min later

const makeSale = (overrides) => ({
  id: 'sale-' + Math.random(),
  orderNumber: '0001',
  timestamp: '2026-05-18T09:00:00.000Z',
  total: 10,
  paymentMethod: 'cash',
  workerId: 'w1',
  items: [{ productName: 'Pupusa', units: [{}], quantity: 1 }],
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
    expect(result.productsSummary).toEqual([]);
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

  it('productsSummary sorts descending by units without truncation', () => {
    // Arrange
    const sales = [
      makeSale({ items: [
        { productName: 'A', units: [{}, {}], quantity: 2 },
        { productName: 'B', units: [{}], quantity: 1 },
      ]}),
      makeSale({ items: [
        { productName: 'C', units: [{}, {}, {}], quantity: 3 },
        { productName: 'D', units: [{}, {}, {}, {}], quantity: 4 },
        { productName: 'A', units: [{}, {}], quantity: 2 },
      ]}),
    ];
    const input = { shiftStartedAt: BASE_TIME, sales, workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.productsSummary.length).toBe(4);
    expect(result.productsSummary[0].units).toBeGreaterThanOrEqual(result.productsSummary[1].units);
    expect(result.productsSummary[1].units).toBeGreaterThanOrEqual(result.productsSummary[2].units);
    const names = result.productsSummary.map(p => p.name);
    expect(names).toContain('A');
    expect(names).toContain('B');
    expect(names).toContain('C');
    expect(names).toContain('D');
  });

  it('productsSummary includes all products when more than 3', () => {
    // Arrange
    const items = ['P1','P2','P3','P4','P5','P6','P7'].map(n => ({
      productName: n, units: [{}], quantity: 1,
    }));
    const sales = [makeSale({ items })];
    const input = { shiftStartedAt: BASE_TIME, sales, workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.productsSummary.length).toBe(7);
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

  it('productsSummary uses productName field from sale items', () => {
    // Arrange
    const sales = [makeSale({ items: [{ productName: 'Pupusa revuelta', units: [{}, {}], quantity: 2 }] })];
    const input = { shiftStartedAt: BASE_TIME, sales, workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.productsSummary[0].name).toBe('Pupusa revuelta');
  });

  it('shiftSales contains the filtered sales array', () => {
    // Arrange
    const s1 = makeSale({ timestamp: '2026-05-18T09:00:00.000Z' });
    const s2 = makeSale({ timestamp: '2026-05-18T07:00:00.000Z' }); // before shift
    const input = { shiftStartedAt: BASE_TIME, sales: [s1, s2], workerId: 'w1', now: LATER_TIME };

    // Act
    const result = computeShiftSummary(input);

    // Assert
    expect(result.shiftSales).toHaveLength(1);
    expect(result.shiftSales[0].id).toBe(s1.id);
  });
});
