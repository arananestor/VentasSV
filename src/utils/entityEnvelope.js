const attachEnvelope = (entity, { deviceId, accountId = null } = {}) => {
  if (!deviceId && !entity.deviceId) {
    throw new Error('deviceId is required for entity envelope');
  }
  return {
    ...entity,
    accountId: entity.accountId !== undefined ? entity.accountId : accountId,
    deviceId: entity.deviceId || deviceId,
    syncState: entity.syncState || 'local',
    serverUpdatedAt: entity.serverUpdatedAt !== undefined ? entity.serverUpdatedAt : null,
  };
};

const markPending = (entity) => ({ ...entity, syncState: 'pending' });

const markSynced = (entity, serverUpdatedAt) => ({
  ...entity,
  syncState: 'synced',
  serverUpdatedAt,
});

module.exports = { attachEnvelope, markPending, markSynced };
