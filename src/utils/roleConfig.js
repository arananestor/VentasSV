const ALL_TABS = ['Venta', 'Comandas', 'Ventas', 'Perfil'];

// Administrative-only tabs — extends with Dashboard when built
const ADMIN_ONLY_TABS = ['Perfil'];

const PUESTO_TABS = {
  Cajero:    ['Venta', 'Ventas', 'Perfil'],
  Cocinero:  ['Comandas', 'Perfil'],
  Motorista: ['Perfil'],
  Camarero:  ['Perfil'],
};

const getTabsForWorker = (worker) => {
  if (!worker) return ['Perfil'];
  if (worker.role === 'owner') {
    return worker.ownerMode === 'administrativo' ? [...ADMIN_ONLY_TABS] : [...ALL_TABS];
  }
  if (worker.role === 'co-admin') return [...ALL_TABS];
  const tabs = PUESTO_TABS[worker.puesto];
  if (tabs) return [...tabs];
  return ['Perfil'];
};

module.exports = { ALL_TABS, ADMIN_ONLY_TABS, PUESTO_TABS, getTabsForWorker };
