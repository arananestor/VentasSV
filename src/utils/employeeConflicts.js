/**
 * Employee-catalog conflict detection.
 * Pure function — no side effects, no hooks, fully testable.
 * Conflicts are computed runtime, never persisted.
 */

const { expandToRanges } = require('./modeScheduling');

function detectEmployeeConflicts(modes) {
  if (!modes || modes.length === 0) return [];

  // Build workerId → list of mode indices
  const workerModes = {};
  modes.forEach((mode, modeIdx) => {
    (mode.assignedWorkerIds || []).forEach(wId => {
      if (!workerModes[wId]) workerModes[wId] = [];
      workerModes[wId].push(modeIdx);
    });
  });

  const conflicts = [];
  const seen = new Set();

  Object.entries(workerModes).forEach(([workerId, modeIndices]) => {
    if (modeIndices.length < 2) return;

    // Pairwise comparison
    for (let i = 0; i < modeIndices.length; i++) {
      for (let j = i + 1; j < modeIndices.length; j++) {
        const modeA = modes[modeIndices[i]];
        const modeB = modes[modeIndices[j]];
        const actsA = modeA.scheduledActivations || [];
        const actsB = modeB.scheduledActivations || [];

        if (actsA.length === 0 || actsB.length === 0) continue;

        actsA.forEach(actA => {
          const rangesA = expandToRanges(actA);
          actsB.forEach(actB => {
            const rangesB = expandToRanges(actB);
            rangesA.forEach(rA => {
              rangesB.forEach(rB => {
                if (rA.day === rB.day) {
                  const oStart = Math.max(rA.startMin, rB.startMin);
                  const oEnd = Math.min(rA.endMin, rB.endMin);
                  if (oStart < oEnd) {
                    // Dedup key: workerId + ordered modeIds + day + range
                    const key = `${workerId}|${modeA.id}|${modeB.id}|${rA.day}|${oStart}|${oEnd}`;
                    if (!seen.has(key)) {
                      seen.add(key);
                      conflicts.push({
                        workerId,
                        modeIdA: modeA.id,
                        modeIdB: modeB.id,
                        day: rA.day,
                        startMin: oStart,
                        endMin: oEnd,
                      });
                    }
                  }
                }
              });
            });
          });
        });
      }
    }
  });

  return conflicts;
}

module.exports = { detectEmployeeConflicts };
