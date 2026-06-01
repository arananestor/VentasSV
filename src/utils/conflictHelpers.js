/**
 * Helpers for employee-catalog conflict display.
 * Pure functions — no side effects, no hooks.
 */

const { expandToRanges } = require('./modeScheduling');

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getConflictDescription(conflict, modes, workers) {
  const worker = (workers || []).find(w => w.id === conflict.workerId);
  const modeA = (modes || []).find(m => m.id === conflict.modeIdA);
  const modeB = (modes || []).find(m => m.id === conflict.modeIdB);
  return {
    workerName: worker?.name || 'Empleado',
    modeAName: modeA?.name || 'Catálogo',
    modeBName: modeB?.name || 'Catálogo',
    dayLabel: DAY_LABELS[conflict.day] || '',
    timeRange: `${minutesToTime(conflict.startMin)} a ${minutesToTime(conflict.endMin)}`,
  };
}

function computeAvatarsInCell(activations, modes, workers, day, startMin, endMin) {
  const workerIds = new Set();

  (activations || []).forEach(act => {
    const ranges = expandToRanges(act);
    const touches = ranges.some(r => r.day === day && r.startMin < endMin && r.endMin > startMin);
    if (!touches) return;
    const mode = (modes || []).find(m => m.id === act.modeId);
    (mode?.assignedWorkerIds || []).forEach(wId => workerIds.add(wId));
  });

  const all = [...workerIds].map(wId => {
    const w = (workers || []).find(wr => wr.id === wId);
    return {
      workerId: wId,
      initial: w?.name?.charAt(0)?.toUpperCase() || '?',
      isOwner: w?.role === 'owner',
    };
  });

  const visible = all.slice(0, 3);
  const overflowCount = Math.max(0, all.length - 3);
  return { visible, overflowCount };
}

function hasConflictInCell(conflicts, day, startMin, endMin) {
  return (conflicts || []).some(c =>
    c.day === day && c.startMin < endMin && c.endMin > startMin
  );
}

module.exports = { getConflictDescription, computeAvatarsInCell, hasConflictInCell };
