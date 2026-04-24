const { newId } = require('./ids');

const evaluateSchedule = ({ modes = [], currentModeId, now }) => {
  const nowTime = new Date(now).getTime();
  let bestActivate = null;
  let bestRevert = null;

  for (const mode of modes) {
    for (const entry of (mode.scheduledActivations || [])) {
      const start = new Date(entry.startsAt).getTime();
      const end = entry.endsAt ? new Date(entry.endsAt).getTime() : Infinity;

      if (start <= nowTime && nowTime <= end && currentModeId !== mode.id) {
        if (!bestActivate || start > new Date(bestActivate.startsAt).getTime()) {
          bestActivate = { ...entry, targetModeId: mode.id };
        }
      }

      if (entry.endsAt && end < nowTime && currentModeId === mode.id && entry.previousModeId) {
        if (!bestRevert || end > new Date(bestRevert.endsAt).getTime()) {
          bestRevert = { ...entry, targetModeId: entry.previousModeId };
        }
      }
    }
  }

  if (bestActivate) return { action: 'activate', targetModeId: bestActivate.targetModeId, scheduledEntryId: bestActivate.id };
  if (bestRevert) return { action: 'revert', targetModeId: bestRevert.targetModeId, scheduledEntryId: bestRevert.id };
  return { action: 'none', targetModeId: null, scheduledEntryId: null };
};

const appendScheduledActivation = (mode, { startsAt, endsAt = null, previousModeId }) => ({
  ...mode,
  scheduledActivations: [
    ...(mode.scheduledActivations || []),
    { id: newId(), startsAt, endsAt, previousModeId, createdAt: new Date().toISOString() },
  ],
  updatedAt: new Date().toISOString(),
});

const removeScheduledActivation = (mode, entryId) => ({
  ...mode,
  scheduledActivations: (mode.scheduledActivations || []).filter(e => e.id !== entryId),
  updatedAt: new Date().toISOString(),
});

const isScheduleValid = ({ startsAt, endsAt }) => {
  if (!startsAt) return false;
  const start = new Date(startsAt).getTime();
  if (isNaN(start)) return false;
  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (isNaN(end) || end <= start) return false;
  }
  return true;
};

module.exports = { evaluateSchedule, appendScheduledActivation, removeScheduledActivation, isScheduleValid };
