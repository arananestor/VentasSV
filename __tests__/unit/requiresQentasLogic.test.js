import { decideRender } from '../../src/utils/requiresQentasLogic';

describe('decideRender', () => {
  it('connected with children returns children', () => {
    // Arrange / Act
    const result = decideRender({ isConnected: true, children: 'content', fallback: null });
    // Assert
    expect(result).toBe('children');
  });

  it('disconnected with fallback returns fallback', () => {
    // Arrange / Act
    const result = decideRender({ isConnected: false, children: 'content', fallback: 'upgrade' });
    // Assert
    expect(result).toBe('fallback');
  });

  it('disconnected without fallback returns null', () => {
    // Arrange / Act
    const result = decideRender({ isConnected: false, children: 'content', fallback: null });
    // Assert
    expect(result).toBe('null');
  });

  it('connected with fallback present still returns children', () => {
    // Arrange / Act
    const result = decideRender({ isConnected: true, children: 'content', fallback: 'upgrade' });
    // Assert
    expect(result).toBe('children');
  });

  it('children null returns null even if connected', () => {
    // Arrange / Act
    const result = decideRender({ isConnected: true, children: null, fallback: null });
    // Assert
    expect(result).toBe('null');
  });

  it('fallback null and disconnected returns null', () => {
    // Arrange / Act
    const result = decideRender({ isConnected: false, children: 'content', fallback: undefined });
    // Assert
    expect(result).toBe('null');
  });
});
