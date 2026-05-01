/**
 * Collapsible header — pure logic tests
 * Tests animation configuration constants and interpolation configs
 * using real functions from collapsibleHeader utility
 */

import {
  COLLAPSE_THRESHOLD,
  TAB_BAR_HEIGHT,
  TAB_BAR_MARGIN,
  getInterpolationConfigs,
} from '../../src/utils/collapsibleHeader';

describe('Collapsible header constants', () => {
  it('threshold is 50px for responsive feel', () => {
    // Arrange / Act
    const threshold = COLLAPSE_THRESHOLD;

    // Assert
    expect(threshold).toBe(50);
  });

  it('tab bar height matches POSScreen tabBarWrapper', () => {
    // Arrange / Act
    const height = TAB_BAR_HEIGHT;

    // Assert
    expect(height).toBe(38);
  });

  it('tab bar margin matches POSScreen tabBarWrapper marginBottom', () => {
    // Arrange / Act
    const margin = TAB_BAR_MARGIN;

    // Assert
    expect(margin).toBe(4);
  });
});

describe('getInterpolationConfigs', () => {
  it('returns all required config keys', () => {
    // Arrange / Act
    const configs = getInterpolationConfigs();

    // Assert
    expect(configs).toHaveProperty('tabBarOpacity');
    expect(configs).toHaveProperty('tabBarHeight');
    expect(configs).toHaveProperty('tabBarMargin');
    expect(configs).toHaveProperty('expandedSectionOpacity');
    expect(configs).toHaveProperty('miniModeOpacity');
  });

  it('all configs use clamp extrapolation', () => {
    // Arrange / Act
    const configs = getInterpolationConfigs();

    // Assert
    Object.values(configs).forEach(config => {
      expect(config.extrapolate).toBe('clamp');
    });
  });

  it('all configs use COLLAPSE_THRESHOLD as max input', () => {
    // Arrange / Act
    const configs = getInterpolationConfigs();

    // Assert
    Object.values(configs).forEach(config => {
      expect(config.inputRange).toEqual([0, COLLAPSE_THRESHOLD]);
    });
  });

  it('tabBarOpacity goes from 1 (visible) to 0 (hidden)', () => {
    // Arrange / Act
    const { tabBarOpacity } = getInterpolationConfigs();

    // Assert
    expect(tabBarOpacity.outputRange).toEqual([1, 0]);
  });

  it('tabBarHeight goes from TAB_BAR_HEIGHT to 0', () => {
    // Arrange / Act
    const { tabBarHeight } = getInterpolationConfigs();

    // Assert
    expect(tabBarHeight.outputRange).toEqual([TAB_BAR_HEIGHT, 0]);
  });

  it('tabBarMargin goes from TAB_BAR_MARGIN to 0', () => {
    // Arrange / Act
    const { tabBarMargin } = getInterpolationConfigs();

    // Assert
    expect(tabBarMargin.outputRange).toEqual([TAB_BAR_MARGIN, 0]);
  });

  it('expandedSectionOpacity goes from 1 to 0 (mode indicator fades out)', () => {
    // Arrange / Act
    const { expandedSectionOpacity } = getInterpolationConfigs();

    // Assert
    expect(expandedSectionOpacity.outputRange).toEqual([1, 0]);
  });

  it('miniModeOpacity goes from 0 to 1 (compact indicator fades in)', () => {
    // Arrange / Act
    const { miniModeOpacity } = getInterpolationConfigs();

    // Assert
    expect(miniModeOpacity.outputRange).toEqual([0, 1]);
  });

  it('miniModeOpacity is inverse of expandedSectionOpacity', () => {
    // Arrange / Act
    const { miniModeOpacity, expandedSectionOpacity } = getInterpolationConfigs();

    // Assert
    expect(miniModeOpacity.outputRange[0]).toBe(expandedSectionOpacity.outputRange[1]);
    expect(miniModeOpacity.outputRange[1]).toBe(expandedSectionOpacity.outputRange[0]);
  });
});
