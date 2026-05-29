/**
 * Declarative permissions matrix.
 * Pure function can(worker, action) — no side effects, no hooks.
 */

const PERMISSIONS = {
  owner: {
    'use-pos': true,
    'view-orders': true,
    'view-day-sales': true,
    'share-shift-summary': true,
    'close-cash-register': true,
    'view-catalogs': true,
    'edit-business-config': true,
    'edit-catalogs': true,
    'toggle-owner-mode': true,
    'view-historical-sales': true,
    'export-historical-csv': true,
    'view-owner-dashboard': true,
    'view-employee-basic-info': true,
    'view-employee-sensitive-data': true,
    'create-employee': true,
    'edit-employee': true,
    'delete-employee': true,
    'change-employee-role': true,
    'assign-catalog': true,
  },
  'co-admin': {
    'use-pos': true,
    'view-orders': true,
    'view-day-sales': true,
    'share-shift-summary': true,
    'close-cash-register': true,
    'view-employee-basic-info': true,
  },
};

function can(worker, action) {
  if (!worker || !worker.role || !action) return false;
  const rolePerms = PERMISSIONS[worker.role];
  if (!rolePerms) return false;
  return rolePerms[action] === true;
}

module.exports = { PERMISSIONS, can };
