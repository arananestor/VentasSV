/**
 * Normalizes scheduledActivation from legacy or new shape to canonical shape.
 * Legacy shape: { startsAt, endsAt, previousModeId }
 * Canonical shape: { id, type, modeId, date|days, startTime, endTime, createdAt }
 */

const { newId } = require('./ids');

function normalizeScheduledActivation(act, modeId) {
  if (!act || typeof act !== 'object') return null;

  // Already new shape
  if (act.type === 'evento' || act.type === 'recurrente') {
    return {
      ...act,
      id: act.id || newId(),
      modeId: act.modeId || modeId,
      createdAt: act.createdAt || new Date().toISOString(),
    };
  }

  // Legacy shape with startsAt/endsAt
  if (act.startsAt) {
    try {
      const startDate = new Date(act.startsAt);
      if (isNaN(startDate.getTime())) return null;

      const date = act.startsAt.slice(0, 10);
      const startTime = act.startsAt.slice(11, 16);
      const endTime = act.endsAt ? act.endsAt.slice(11, 16) : '23:59';

      return {
        id: act.id || newId(),
        type: 'evento',
        modeId: act.modeId || modeId,
        date,
        startTime,
        endTime,
        createdAt: act.createdAt || new Date().toISOString(),
      };
    } catch (e) {
      console.warn('Failed to normalize scheduledActivation:', act);
      return null;
    }
  }

  console.warn('Unrecognized scheduledActivation shape:', act);
  return null;
}

function normalizeModeActivations(mode) {
  if (!mode || !mode.scheduledActivations || mode.scheduledActivations.length === 0) {
    return mode;
  }
  return {
    ...mode,
    scheduledActivations: mode.scheduledActivations
      .map(act => normalizeScheduledActivation(act, mode.id))
      .filter(Boolean),
  };
}

module.exports = { normalizeScheduledActivation, normalizeModeActivations };
