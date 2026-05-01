/**
 * Collapsible header animation configuration.
 *
 * scrollY drives all interpolations:
 *   0px  → fully expanded (tabs visible, mini-mode hidden)
 *   50px → fully collapsed (tabs hidden, mini-mode visible)
 */

export const COLLAPSE_THRESHOLD = 50;
export const TAB_BAR_HEIGHT = 38;
export const TAB_BAR_MARGIN = 4;

export function getInterpolationConfigs() {
  return {
    tabBarOpacity: {
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    },
    tabBarHeight: {
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [TAB_BAR_HEIGHT, 0],
      extrapolate: 'clamp',
    },
    tabBarMargin: {
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [TAB_BAR_MARGIN, 0],
      extrapolate: 'clamp',
    },
    expandedSectionOpacity: {
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    },
    miniModeOpacity: {
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    },
  };
}
