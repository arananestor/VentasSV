import { getItemSections, shouldShowNote, formatExtras, formatItemLine, hasPaymentDetails } from '../../src/utils/saleDetailLogic';

describe('getItemSections', () => {
  it('1 item produces 1 section', () => {
    // Arrange
    const sale = { items: [{ productName: 'Pupusa', size: 'Grande', quantity: 2, subtotal: 3.00 }] };
    // Act
    const sections = getItemSections(sale);
    // Assert
    expect(sections).toHaveLength(1);
    expect(sections[0].productName).toBe('Pupusa');
  });

  it('3 items produce 3 sections', () => {
    // Arrange
    const sale = { items: [{ productName: 'A' }, { productName: 'B' }, { productName: 'C' }] };
    // Act
    const sections = getItemSections(sale);
    // Assert
    expect(sections).toHaveLength(3);
  });

  it('uses defaults for missing fields', () => {
    // Arrange
    const sale = { items: [{}] };
    // Act
    const sections = getItemSections(sale);
    // Assert
    expect(sections[0].size).toBe('');
    expect(sections[0].extras).toEqual([]);
    expect(sections[0].note).toBe('');
    expect(sections[0].units).toEqual([]);
  });
});

describe('shouldShowNote', () => {
  it('true for item with note', () => {
    // Arrange / Act
    const result = shouldShowNote({ note: 'sin chile' });
    // Assert
    expect(result).toBe(true);
  });

  it('false for empty note', () => {
    // Arrange / Act
    const result = shouldShowNote({ note: '' });
    // Assert
    expect(result).toBe(false);
  });

  it('false for whitespace-only note', () => {
    // Arrange / Act
    const result = shouldShowNote({ note: '   ' });
    // Assert
    expect(result).toBe(false);
  });
});

describe('formatExtras', () => {
  it('joins string extras', () => {
    // Arrange / Act
    const result = formatExtras(['Queso', 'Frijol']);
    // Assert
    expect(result).toBe('Queso, Frijol');
  });

  it('joins object extras by name', () => {
    // Arrange / Act
    const result = formatExtras([{ name: 'Queso' }, { name: 'Guac' }]);
    // Assert
    expect(result).toBe('Queso, Guac');
  });

  it('returns empty for no extras', () => {
    // Arrange / Act
    const result = formatExtras([]);
    // Assert
    expect(result).toBe('');
  });
});

describe('formatItemLine', () => {
  it('formats complete item', () => {
    // Arrange
    const item = { productName: 'Pupusa', size: 'Grande', quantity: 2 };
    // Act
    const result = formatItemLine(item);
    // Assert
    expect(result).toBe('Pupusa · Grande · 2x');
  });

  it('omits size if empty', () => {
    // Arrange
    const item = { productName: 'Soda', size: '', quantity: 1 };
    // Act
    const result = formatItemLine(item);
    // Assert
    expect(result).toBe('Soda · 1x');
  });
});

describe('hasPaymentDetails', () => {
  it('true for cash with cashGiven', () => {
    // Arrange / Act
    const result = hasPaymentDetails({ paymentMethod: 'cash', cashGiven: 5.00 });
    // Assert
    expect(result).toBe(true);
  });

  it('false for transfer', () => {
    // Arrange / Act
    const result = hasPaymentDetails({ paymentMethod: 'transfer' });
    // Assert
    expect(result).toBe(false);
  });
});
