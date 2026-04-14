import React from 'react';
import useQentasConnection from '../hooks/useQentasConnection';
import { decideRender } from '../utils/requiresQentasLogic';

export default function RequiresQentas({ children, fallback }) {
  const { isConnected } = useQentasConnection();
  const decision = decideRender({ isConnected, children, fallback });
  if (decision === 'children') return children;
  if (decision === 'fallback') return fallback;
  return null;
}
