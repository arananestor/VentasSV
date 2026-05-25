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

/**
 * Detects overlap between a new activation and existing ones.
 * Supports cross-day (startTime > endTime means overnight).
 * Returns array of { activationId, modeId, overlapDay, overlapStart, overlapEnd }.
 */
const detectScheduleOverlap = (newActivation, existingActivations) => {
  if (!existingActivations || existingActivations.length === 0) return [];

  const newRanges = expandToRanges(newActivation);
  const overlaps = [];

  existingActivations.forEach(existing => {
    const existingRanges = expandToRanges(existing);
    newRanges.forEach(nr => {
      existingRanges.forEach(er => {
        if (nr.day === er.day) {
          const oStart = Math.max(nr.startMin, er.startMin);
          const oEnd = Math.min(nr.endMin, er.endMin);
          if (oStart < oEnd) {
            overlaps.push({
              activationId: existing.id,
              modeId: existing.modeId,
              overlapDay: nr.day,
              overlapStart: minutesToTime(oStart),
              overlapEnd: minutesToTime(oEnd),
            });
          }
        }
      });
    });
  });

  return overlaps;
};

/**
 * Determines which mode should be active at a given time.
 * Priority: manualOverride > evento > recurrente > Principal.
 */
const getActiveModeAt = (now, modes, scheduledActivations, manualOverride) => {
  if (manualOverride) return manualOverride;

  const d = new Date(now);
  const nowMin = d.getUTCHours() * 60 + d.getUTCMinutes();
  const dayOfWeek = d.getUTCDay(); // 0=Sun
  const dateStr = now instanceof Date ? now.toISOString().slice(0, 10) : (typeof now === 'string' ? now.slice(0, 10) : '');

  let eventoMatch = null;
  let recurrenteMatch = null;

  (scheduledActivations || []).forEach(act => {
    const ranges = expandToRanges(act);
    const isActive = ranges.some(r => {
      if (r.day === dayOfWeek && nowMin >= r.startMin && nowMin < r.endMin) return true;
      // Cross-day: check if yesterday's overnight range covers now
      const yesterday = (dayOfWeek + 6) % 7;
      if (r.day === yesterday && r.endMin > 24 * 60) {
        const overflowEnd = r.endMin - 24 * 60;
        if (nowMin < overflowEnd) return true;
      }
      return false;
    });

    if (!isActive) return;

    if (act.type === 'evento' && act.date === dateStr) {
      eventoMatch = act.modeId;
    } else if (act.type === 'recurrente') {
      recurrenteMatch = act.modeId;
    }
  });

  if (eventoMatch) return eventoMatch;
  if (recurrenteMatch) return recurrenteMatch;

  const principal = modes.find(m => m.isDefault);
  return principal ? principal.id : null;
};

// Internal helpers

function expandToRanges(activation) {
  const startMin = timeToMinutes(activation.startTime || '00:00');
  let endMin = timeToMinutes(activation.endTime || '23:59');
  const crossDay = endMin <= startMin;
  if (crossDay) endMin += 24 * 60; // extend past midnight

  if (activation.type === 'evento' && activation.date) {
    const d = new Date(activation.date + 'T00:00:00Z');
    const day = d.getUTCDay();
    return [{ day, startMin, endMin }];
  }

  if (activation.type === 'recurrente' && activation.days) {
    return activation.days.map(day => ({ day, startMin, endMin }));
  }

  return [];
}

function timeToMinutes(time) {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = {
  evaluateSchedule, appendScheduledActivation, removeScheduledActivation, isScheduleValid,
  detectScheduleOverlap, getActiveModeAt,
};
