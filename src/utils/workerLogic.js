const loginMatch = (workers, pin, workerId) =>
  workers.find(w => w.id === workerId && w.pin === pin) || null;

const isValidPin = (pin) => /^\d{4}$/.test(pin);

const isAdmin = (worker) =>
  worker?.role === 'owner' || worker?.role === 'co-admin';

const canRemoveWorker = (id) => id !== 'owner';

const verifyOwnerPin = (workers, pin) => {
  const owner = workers.find(w => w.role === 'owner');
  return owner?.pin === pin;
};

const buildOwnerData = (pin, name) => ({
  id: 'owner',
  name: name.trim(),
  pin,
  role: 'owner',
  puesto: 'Dueño',
  dui: '',
  photo: null,
  color: '#FFFFFF',
});

const canSaveProduct = (worker) =>
  worker?.role === 'owner' || worker?.role === 'co-admin';

const isPinDuplicate = (workers, pin) =>
  !!workers.find(w => w.pin === pin);

const getRoleForPuesto = (puesto) =>
  puesto === 'Encargado' ? 'co-admin' : 'worker';

module.exports = {
  loginMatch, isValidPin, isAdmin, canRemoveWorker,
  verifyOwnerPin, buildOwnerData, canSaveProduct,
  isPinDuplicate, getRoleForPuesto,
};
