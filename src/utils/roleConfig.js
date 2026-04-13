const ALL_TABS = ['Venta', 'Comandas', 'Ventas', 'Perfil'];

const PUESTO_TABS = {
  Cajero:    ['Venta', 'Ventas', 'Perfil'],
  Cocinero:  ['Comandas', 'Perfil'],
  Motorista: ['Perfil'],
  Camarero:  ['Perfil'],
};

const getTabsForWorker = (worker) => {
  if (!worker) return ['Perfil'];
  if (worker.role === 'owner' || worker.role === 'co-admin') return [...ALL_TABS];
  const tabs = PUESTO_TABS[worker.puesto];
  if (tabs) return [...tabs];
  return ['Perfil'];
};

module.exports = { ALL_TABS, PUESTO_TABS, getTabsForWorker };
