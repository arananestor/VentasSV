const getStatusBadgeSizeConfig = (size) => {
  if (size === 'medium') return { dot: 7, fontSize: 11, gap: 8, padding: 12, radius: 12 };
  return { dot: 6, fontSize: 10, gap: 6, padding: 6, radius: 8 };
};

const getDotColor = (color, fallback) => color || fallback;

const getAvatarInitial = (name) =>
  name ? name.charAt(0).toUpperCase() : '?';

const getPuestoDisplay = (puesto, fallback = 'EMPLEADO') =>
  puesto ? puesto.toUpperCase() : fallback;

module.exports = { getStatusBadgeSizeConfig, getDotColor, getAvatarInitial, getPuestoDisplay };
