const canManageModesLocally = (worker) =>
  worker?.role === 'owner';

const validateModeForm = ({ name, existingModes = [], editingId = null }) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return { ok: false, error: 'El nombre no puede estar vacío' };
  if (trimmed.length > 40) return { ok: false, error: 'Máximo 40 caracteres' };
  const dup = existingModes.find(m =>
    m.name.toLowerCase() === trimmed.toLowerCase() && m.id !== editingId
  );
  if (dup) return { ok: false, error: 'Ya existe un catálogo con ese nombre' };
  return { ok: true, error: null };
};

const buildOverridesPatch = ({ currentOverrides = {}, productId, patch }) => {
  const existing = currentOverrides[productId] || { active: true, priceOverride: null };
  let po = patch.priceOverride !== undefined ? patch.priceOverride : existing.priceOverride;
  if (po === '' || (typeof po === 'number' && isNaN(po))) po = null;
  if (po !== null && typeof po !== 'number') po = null;
  return {
    ...currentOverrides,
    [productId]: {
      active: patch.active !== undefined ? patch.active : existing.active,
      priceOverride: po,
    },
  };
};

const reorderTabOrder = (tabOrder, fromIndex, toIndex) => {
  const arr = [...tabOrder];
  const [item] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
  return arr;
};

const findModeForWorker = (modes, workerId) => {
  if (!modes || modes.length === 0) return null;
  if (workerId) {
    const assigned = modes.find(m => (m.assignedWorkerIds || []).includes(workerId));
    if (assigned) return assigned;
  }
  return modes.find(m => m.isDefault) || null;
};

module.exports = { canManageModesLocally, validateModeForm, buildOverridesPatch, reorderTabOrder, findModeForWorker };
