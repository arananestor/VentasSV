import { createMode } from '../../../src/models/mode';
import { isValidUuid } from '../../../src/utils/ids';

// Pure logic that mirrors what AppContext does, testable without React

const canDeleteMode = (modes, modeId, currentModeId) => {
  const mode = modes.find(m => m.id === modeId);
  if (!mode) return { ok: false, reason: 'Catálogo no encontrado' };
  if (mode.isDefault) return { ok: false, reason: 'No se puede eliminar el catálogo principal' };
  if (currentModeId === modeId) return { ok: false, reason: 'No se puede eliminar el catálogo activo' };
  return { ok: true };
};

const cloneModeLogic = (sourceMode, newName) => {
  const overrides = {};
  for (const [k, v] of Object.entries(sourceMode.productOverrides || {})) {
    overrides[k] = { ...v };
  }
  const cloned = createMode({
    name: newName,
    description: sourceMode.description,
    productOverrides: overrides,
    tabOrder: [...sourceMode.tabOrder],
    isDefault: false,
  });
  return cloned;
};

describe('createModeFromForm', () => {
  it('produces mode with isDefault false', () => {
    // Arrange / Act
    const mode = createMode({ name: 'Festival', description: 'Evento especial' });
    // Assert
    expect(mode.isDefault).toBe(false);
    expect(mode.name).toBe('Festival');
    expect(isValidUuid(mode.id)).toBe(true);
  });
});

describe('canDeleteMode', () => {
  const principal = { id: 'm1', name: 'Principal', isDefault: true };
  const festival = { id: 'm2', name: 'Festival', isDefault: false };
  const modes = [principal, festival];

  it('rejects default mode', () => {
    // Arrange / Act
    const result = canDeleteMode(modes, 'm1', 'm2');
    // Assert
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('catálogo principal');
  });

  it('rejects active mode', () => {
    // Arrange / Act
    const result = canDeleteMode(modes, 'm2', 'm2');
    // Assert
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('activo');
  });

  it('allows non-default non-active mode', () => {
    // Arrange / Act
    const result = canDeleteMode(modes, 'm2', 'm1');
    // Assert
    expect(result.ok).toBe(true);
  });

  it('rejects unknown mode', () => {
    // Arrange / Act
    const result = canDeleteMode(modes, 'm99', 'm1');
    // Assert
    expect(result.ok).toBe(false);
  });
});

describe('cloneModeLogic', () => {
  it('copies productOverrides and tabOrder with new id', () => {
    // Arrange
    const source = createMode({
      name: 'Original',
      productOverrides: { p1: { active: true, priceOverride: null } },
      tabOrder: ['t1', 't2'],
      isDefault: true,
    });
    // Act
    const cloned = cloneModeLogic(source, 'Copia');
    // Assert
    expect(cloned.name).toBe('Copia');
    expect(cloned.id).not.toBe(source.id);
    expect(cloned.isDefault).toBe(false);
    expect(cloned.productOverrides).toEqual(source.productOverrides);
    expect(cloned.tabOrder).toEqual(source.tabOrder);
  });

  it('cloned productOverrides is not the same reference', () => {
    // Arrange
    const source = createMode({ name: 'A', productOverrides: { p1: { active: true, priceOverride: null } } });
    // Act
    const cloned = cloneModeLogic(source, 'B');
    cloned.productOverrides.p1.active = false;
    // Assert
    expect(source.productOverrides.p1.active).toBe(true);
  });
});
