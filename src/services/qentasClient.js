/**
 * Qentas Cloud Client — Stub
 *
 * This module defines the stable contract that the Qentas backend will implement.
 * Today all methods return offline/unavailable responses. When Qentas has a real
 * API, only this file changes — all consumers (hooks, components, contexts)
 * remain the same.
 */

const qentasClient = {
  /**
   * Whether the device is currently connected to a Qentas account.
   * @returns {boolean}
   */
  isConnected: () => false,

  /**
   * Returns the connected Qentas account info, or null if not connected.
   * @returns {{ id: string, ownerEmail: string, plan: string } | null}
   */
  getAccount: () => null,

  /**
   * Pushes a sync event to the Qentas cloud. No-op while disconnected.
   * @param {object} event - { type, entityType, entityId, payload, timestamp }
   * @returns {Promise<void>}
   */
  pushEvent: async (_event) => {},

  /**
   * Subscribes to real-time changes for an entity type. Returns unsubscribe fn.
   * @param {string} _entityType - 'sales' | 'products' | 'workers' | 'tabs'
   * @param {function} _callback - (event) => void
   * @returns {function} unsubscribe
   */
  subscribe: (_entityType, _callback) => () => {},

  /**
   * Connects to a Qentas account. Today always returns error.
   * @param {{ email?: string, password?: string, token?: string }} _credentials
   * @returns {Promise<{ account: object } | { error: string }>}
   */
  connect: async (_credentials) => ({ error: 'qentas_not_available' }),

  /**
   * Disconnects from the Qentas account. No-op while disconnected.
   * @returns {Promise<void>}
   */
  disconnect: async () => {},
};

export default qentasClient;
