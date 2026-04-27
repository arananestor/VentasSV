import { computeResponsive, MIN_CARD_WIDTH } from '../../src/hooks/useResponsive';

describe('computeResponsive', () => {
  describe('phone small (320x568)', () => {
    it('calculates correctly', () => {
      // Arrange
      const w = 320, h = 568;
      // Act
      const r = computeResponsive(w, h);
      // Assert
      expect(r.isTablet).toBe(false);
      expect(r.isLandscape).toBe(false);
      expect(r.columns).toBe(2);
      expect(r.gridCardSize).toBeGreaterThan(100);
      expect(r.gridCardSize).toBeLessThan(200);
      expect(r.padding).toBeGreaterThanOrEqual(16);
      expect(r.gap).toBeGreaterThanOrEqual(10);
      expect(r.layout).toBe('stack');
    });
  });

  describe('iPhone SE (375x667)', () => {
    it('calculates correctly', () => {
      // Arrange
      const w = 375, h = 667;
      // Act
      const r = computeResponsive(w, h);
      // Assert
      expect(r.isTablet).toBe(false);
      expect(r.columns).toBe(2);
      expect(r.gridCardSize).toBeGreaterThan(140);
      expect(r.layout).toBe('stack');
    });
  });

  describe('Android average (412x915)', () => {
    it('calculates correctly', () => {
      // Arrange
      const w = 412, h = 915;
      // Act
      const r = computeResponsive(w, h);
      // Assert
      expect(r.isTablet).toBe(false);
      expect(r.columns).toBe(2);
      expect(r.gridCardSize).toBeGreaterThan(150);
      expect(r.layout).toBe('stack');
    });
  });

  describe('phone large landscape (600x360)', () => {
    it('calculates correctly', () => {
      // Arrange
      const w = 600, h = 360;
      // Act
      const r = computeResponsive(w, h);
      // Assert
      expect(r.isTablet).toBe(false);
      expect(r.isLandscape).toBe(true);
      expect(r.columns).toBeGreaterThanOrEqual(3);
      expect(r.layout).toBe('stack');
    });
  });

  describe('tablet portrait (800x1280)', () => {
    it('calculates correctly', () => {
      // Arrange
      const w = 800, h = 1280;
      // Act
      const r = computeResponsive(w, h);
      // Assert
      expect(r.isTablet).toBe(true);
      expect(r.isLandscape).toBe(false);
      expect(r.columns).toBeGreaterThanOrEqual(4);
      expect(r.gridCardSize).toBeGreaterThan(100);
      expect(r.layout).toBe('stack');
    });
  });

  describe('tablet landscape (1200x800)', () => {
    it('calculates correctly', () => {
      // Arrange
      const w = 1200, h = 800;
      // Act
      const r = computeResponsive(w, h);
      // Assert
      expect(r.isTablet).toBe(true);
      expect(r.isLandscape).toBe(true);
      expect(r.columns).toBeGreaterThanOrEqual(5);
      expect(r.layout).toBe('split');
    });
  });

  describe('proportional scaling', () => {
    it('padding scales with width', () => {
      // Arrange / Act
      const small = computeResponsive(320, 568);
      const large = computeResponsive(1200, 800);
      // Assert
      expect(large.padding).toBeGreaterThan(small.padding);
    });

    it('gap scales with width', () => {
      // Arrange / Act
      const small = computeResponsive(320, 568);
      const large = computeResponsive(1200, 800);
      // Assert
      expect(large.gap).toBeGreaterThan(small.gap);
    });

    it('fontSize.base scales with width', () => {
      // Arrange / Act
      const small = computeResponsive(320, 568);
      const large = computeResponsive(1200, 800);
      // Assert
      expect(large.fontSize.base).toBeGreaterThan(small.fontSize.base);
    });

    it('columns increase with wider screens', () => {
      // Arrange / Act
      const phone = computeResponsive(375, 667);
      const tablet = computeResponsive(1200, 800);
      // Assert
      expect(tablet.columns).toBeGreaterThan(phone.columns);
    });
  });

  describe('minimums enforced', () => {
    it('columns never below 2', () => {
      // Arrange / Act
      const r = computeResponsive(200, 400);
      // Assert
      expect(r.columns).toBeGreaterThanOrEqual(2);
    });

    it('padding never below 16', () => {
      // Arrange / Act
      const r = computeResponsive(200, 400);
      // Assert
      expect(r.padding).toBeGreaterThanOrEqual(16);
    });

    it('gap never below 10', () => {
      // Arrange / Act
      const r = computeResponsive(200, 400);
      // Assert
      expect(r.gap).toBeGreaterThanOrEqual(10);
    });

    it('fontSize.base never below 14', () => {
      // Arrange / Act
      const r = computeResponsive(200, 400);
      // Assert
      expect(r.fontSize.base).toBeGreaterThanOrEqual(14);
    });
  });

  describe('MIN_CARD_WIDTH exported', () => {
    it('is a positive number', () => {
      // Arrange / Act / Assert
      expect(MIN_CARD_WIDTH).toBeGreaterThan(0);
      expect(typeof MIN_CARD_WIDTH).toBe('number');
    });
  });
});
