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

const appendScheduledActivation = (mode, activation) => ({
  ...mode,
  scheduledActivations: [
    ...(mode.scheduledActivations || []),
    { ...activation, id: activation.id || newId(), modeId: mode.id, createdAt: activation.createdAt || new Date().toISOString() },
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
  const nowMin = d.getHours() * 60 + d.getMinutes();
  const dayOfWeek = d.getDay(); // 0=Sun, local time
  const dateStr = localDateString(d);

  let eventoMatch = null;
  let recurrenteMatch = null;

  (scheduledActivations || []).forEach(act => {
    const ranges = expandToRanges(act);
    const isActive = ranges.some(r => r.day === dayOfWeek && nowMin >= r.startMin && nowMin < r.endMin);

    if (!isActive) return;

    if (act.type === 'evento' && act.date && dateStr >= act.date && dateStr <= (act.endDate || act.date)) {
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
  const rawEndMin = timeToMinutes(activation.endTime || '23:59');
  const crossDay = rawEndMin <= startMin;

  if (activation.type === 'evento' && activation.date) {
    const startD = new Date(activation.date + 'T00:00:00'); // local time, no Z
    const endD = activation.endDate
      ? new Date(activation.endDate + 'T00:00:00')
      : startD;
    const ranges = [];
    const cur = new Date(startD);
    while (cur <= endD) {
      const day = cur.getDay();
      if (crossDay) {
        ranges.push({ day, startMin, endMin: 24 * 60 });
        ranges.push({ day: (day + 1) % 7, startMin: 0, endMin: rawEndMin });
      } else {
        ranges.push({ day, startMin, endMin: rawEndMin });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return ranges;
  }

  if (activation.type === 'recurrente' && activation.days) {
    if (crossDay) {
      return activation.days.flatMap(day => [
        { day, startMin, endMin: 24 * 60 },
        { day: (day + 1) % 7, startMin: 0, endMin: rawEndMin },
      ]);
    }
    return activation.days.map(day => ({ day, startMin, endMin: rawEndMin }));
  }

  return [];
}

function localDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  detectScheduleOverlap, getActiveModeAt, expandToRanges,
};
