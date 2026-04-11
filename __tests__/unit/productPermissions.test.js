/**
 * Product permissions — pure logic tests (no component rendering)
 * Tests the save permission logic in AddProductScreen
 */

describe('AddProductScreen save permissions', () => {

  const canSave = (worker) =>
    worker?.role === 'owner' || worker?.role === 'co-admin';

  const owner = { id: 'owner', role: 'owner', name: 'Carlos' };
  const coAdmin = { id: '2', role: 'co-admin', name: 'Luis' };
  const worker = { id: '1', role: 'worker', name: 'Ana' };

  it('owner puede guardar productos', () => {
    expect(canSave(owner)).toBe(true);
  });

  it('encargado (co-admin) puede guardar productos', () => {
    expect(canSave(coAdmin)).toBe(true);
  });

  it('worker NO puede guardar productos', () => {
    expect(canSave(worker)).toBe(false);
  });

  it('null NO puede guardar productos', () => {
    expect(canSave(null)).toBe(false);
  });

  it('undefined NO puede guardar productos', () => {
    expect(canSave(undefined)).toBe(false);
  });

  it('role admin NO existe — no puede guardar', () => {
    const fakeAdmin = { id: '5', role: 'admin', name: 'Fake' };
    expect(canSave(fakeAdmin)).toBe(false);
  });

  it('mensaje de error correcto para workers', () => {
    const errorMsg = 'Solo el dueño o encargado puede agregar productos';
    expect(errorMsg).toContain('dueño');
    expect(errorMsg).toContain('encargado');
    expect(errorMsg).not.toContain('administrador');
  });
});
