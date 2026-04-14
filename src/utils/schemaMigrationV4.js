const { attachEnvelope } = require('./entityEnvelope');

const migrateEntityToV4 = (entity, deviceId) => {
  if (entity.syncState && entity.deviceId) return entity;
  return attachEnvelope(entity, { deviceId });
};

const migrateCollectionToV4 = (collection, deviceId) =>
  collection.map(entity => migrateEntityToV4(entity, deviceId));

module.exports = { migrateEntityToV4, migrateCollectionToV4 };
