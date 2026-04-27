import { useWindowDimensions } from 'react-native';

export const MIN_CARD_WIDTH = 155;

export function computeResponsive(width, height) {
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;

  const padding = Math.max(16, Math.round(width * 0.04));
  const gap = Math.max(10, Math.round(width * 0.03));

  const columns = Math.max(2, Math.floor((width - padding * 2 + gap) / (MIN_CARD_WIDTH + gap)));
  const gridCardSize = (width - padding * 2 - gap * (columns - 1)) / columns;

  const layout = isTablet && isLandscape ? 'split' : 'stack';

  const base = Math.max(14, Math.round(width * 0.038));
  const fontSize = {
    sm: Math.round(base * 0.85),
    base,
    lg: Math.round(base * 1.25),
    xl: Math.round(base * 1.6),
  };

  return { width, height, isTablet, isLandscape, padding, gap, columns, gridCardSize, layout, fontSize };
}

export default function useResponsive() {
  const { width, height } = useWindowDimensions();
  return computeResponsive(width, height);
}
