import { validateUpsellProps, getDefaultCtaLabel } from '../../src/utils/upsellCardLogic';

describe('validateUpsellProps', () => {
  it('valid with title and description', () => {
    // Arrange / Act
    const result = validateUpsellProps({ title: 'Upgrade', description: 'Get more' });
    // Assert
    expect(result.valid).toBe(true);
  });

  it('invalid without title', () => {
    // Arrange / Act
    const result = validateUpsellProps({ description: 'Get more' });
    // Assert
    expect(result.valid).toBe(false);
    expect(result.error).toContain('title');
  });

  it('invalid without description', () => {
    // Arrange / Act
    const result = validateUpsellProps({ title: 'Upgrade' });
    // Assert
    expect(result.valid).toBe(false);
    expect(result.error).toContain('description');
  });
});

describe('getDefaultCtaLabel', () => {
  it('returns default when no arg', () => {
    // Arrange / Act
    const result = getDefaultCtaLabel();
    // Assert
    expect(result).toBe('Conectar Qentas');
  });

  it('returns provided label', () => {
    // Arrange / Act
    const result = getDefaultCtaLabel('Activar');
    // Assert
    expect(result).toBe('Activar');
  });
});
