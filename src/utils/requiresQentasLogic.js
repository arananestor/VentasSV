const decideRender = ({ isConnected, children, fallback }) => {
  if (isConnected && children) return 'children';
  if (!isConnected && fallback) return 'fallback';
  return 'null';
};

module.exports = { decideRender };
