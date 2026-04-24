// Manual UUID v4 implementation — avoids ESM compatibility issues with uuid package in Jest
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hex = (n) => {
  const s = [];
  for (let i = 0; i < n; i++) s.push(Math.floor(Math.random() * 16).toString(16));
  return s.join('');
};

const newId = () =>
  `${hex(8)}-${hex(4)}-4${hex(3)}-${['8','9','a','b'][Math.floor(Math.random() * 4)]}${hex(3)}-${hex(12)}`;

const isValidUuid = (id) => {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
};

module.exports = { newId, isValidUuid };
