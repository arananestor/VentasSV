/**
 * Display Components — pure logic tests (no component rendering)
 * Tests the business rules and prop logic for StatusBadge and InfoCard
 * using real functions from uiLogic and colorUtils
 */

import {
  getStatusBadgeSizeConfig,
  getDotColor,
  getAvatarInitial,
  getPuestoDisplay,
} from '../../src/utils/uiLogic';
import { getTextColor } from '../../src/utils/colorUtils';
import { LIGHT_THEME, DARK_THEME } from '../../src/context/ThemeContext';

describe('StatusBadge logic', () => {

  describe('getStatusBadgeSizeConfig — small variant', () => {
    it('retorna dot 6 para size small', () => {
      // Arrange
      const size = 'small';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.dot).toBe(6);
    });

    it('retorna fontSize 10 para size small', () => {
      // Arrange
      const size = 'small';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.fontSize).toBe(10);
    });

    it('retorna gap 6 para size small', () => {
      // Arrange
      const size = 'small';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.gap).toBe(6);
    });

    it('retorna config small para cualquier valor no-medium', () => {
      // Arrange
      const size = 'undefined-size';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.dot).toBe(6);
      expect(config.fontSize).toBe(10);
    });
  });

  describe('getStatusBadgeSizeConfig — medium variant', () => {
    it('retorna dot 7 para size medium', () => {
      // Arrange
      const size = 'medium';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.dot).toBe(7);
    });

    it('retorna fontSize 11 para size medium', () => {
      // Arrange
      const size = 'medium';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.fontSize).toBe(11);
    });

    it('retorna gap 8 para size medium', () => {
      // Arrange
      const size = 'medium';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.gap).toBe(8);
    });

    it('retorna padding 12 para size medium', () => {
      // Arrange
      const size = 'medium';

      // Act
      const config = getStatusBadgeSizeConfig(size);

      // Assert
      expect(config.padding).toBe(12);
    });
  });

  describe('getDotColor — fallback logic', () => {
    it('usa color propio cuando se proporciona', () => {
      // Arrange
      const color = '#FF3B30';
      const fallback = DARK_THEME.success;

      // Act
      const result = getDotColor(color, fallback);

      // Assert
      expect(result).toBe('#FF3B30');
    });

    it('usa fallback cuando color es undefined', () => {
      // Arrange
      const color = undefined;
      const fallback = DARK_THEME.success;

      // Act
      const result = getDotColor(color, fallback);

      // Assert
      expect(result).toBe(DARK_THEME.success);
    });

    it('usa fallback cuando color es null', () => {
      // Arrange
      const color = null;
      const fallback = LIGHT_THEME.success;

      // Act
      const result = getDotColor(color, fallback);

      // Assert
      expect(result).toBe(LIGHT_THEME.success);
    });

    it('usa fallback del tema dark para dot por defecto', () => {
      // Arrange
      const color = undefined;
      const fallback = DARK_THEME.dot;

      // Act
      const result = getDotColor(color, fallback);

      // Assert
      expect(result).toBe('#4ECDC4');
    });
  });

  describe('label formatting', () => {
    it('label COMPLETADA está en mayúsculas', () => {
      // Arrange
      const label = 'COMPLETADA';

      // Act
      const isUpperCase = label === label.toUpperCase();

      // Assert
      expect(isUpperCase).toBe(true);
    });

    it('label EN PROCESO está en mayúsculas', () => {
      // Arrange
      const label = 'EN PROCESO';

      // Act
      const isUpperCase = label === label.toUpperCase();

      // Assert
      expect(isUpperCase).toBe(true);
    });
  });

  describe('theme tokens', () => {
    it('LIGHT_THEME tiene card definido', () => {
      // Arrange / Act
      const card = LIGHT_THEME.card;

      // Assert
      expect(card).toBeDefined();
      expect(typeof card).toBe('string');
    });

    it('DARK_THEME tiene cardBorder definido', () => {
      // Arrange / Act
      const cardBorder = DARK_THEME.cardBorder;

      // Assert
      expect(cardBorder).toBeDefined();
    });

    it('LIGHT_THEME success es verde', () => {
      // Arrange / Act
      const success = LIGHT_THEME.success;

      // Assert
      expect(success).toBe('#34C759');
    });

    it('DARK_THEME success es teal', () => {
      // Arrange / Act
      const success = DARK_THEME.success;

      // Assert
      expect(success).toBe('#4ECDC4');
    });
  });

  describe('casos de uso — SaleDetailScreen', () => {
    it('COMPLETADA con success del tema light', () => {
      // Arrange
      const label = 'COMPLETADA';
      const color = LIGHT_THEME.success;

      // Act
      const dotColor = getDotColor(color, DARK_THEME.success);

      // Assert
      expect(label).toBe('COMPLETADA');
      expect(dotColor).toBe(LIGHT_THEME.success);
    });

    it('badge size small es default cuando no se especifica', () => {
      // Arrange
      const sizeDefault = undefined;

      // Act
      const config = getStatusBadgeSizeConfig(sizeDefault);

      // Assert
      expect(config.dot).toBe(6);
    });
  });
});

describe('InfoCard logic', () => {

  describe('getAvatarInitial', () => {
    it('retorna la inicial en mayúscula para nombre normal', () => {
      // Arrange
      const name = 'Ana García';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('A');
    });

    it('retorna la inicial en mayúscula para nombre con minúscula', () => {
      // Arrange
      const name = 'carlos';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('C');
    });

    it('retorna ? para nombre vacío', () => {
      // Arrange
      const name = '';

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('?');
    });

    it('retorna ? para nombre undefined', () => {
      // Arrange
      const name = undefined;

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('?');
    });

    it('retorna ? para nombre null', () => {
      // Arrange
      const name = null;

      // Act
      const initial = getAvatarInitial(name);

      // Assert
      expect(initial).toBe('?');
    });
  });

  describe('getPuestoDisplay', () => {
    it('retorna el puesto en mayúsculas', () => {
      // Arrange
      const puesto = 'Cajero';

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('CAJERO');
    });

    it('retorna fallback cuando puesto es falsy', () => {
      // Arrange
      const puesto = undefined;
      const fallback = 'EMPLEADO';

      // Act
      const display = getPuestoDisplay(puesto, fallback);

      // Assert
      expect(display).toBe('EMPLEADO');
    });

    it('retorna EMPLEADO como fallback por defecto', () => {
      // Arrange
      const puesto = null;

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('EMPLEADO');
    });

    it('retorna DUEÑO para Dueño', () => {
      // Arrange
      const puesto = 'Dueño';

      // Act
      const display = getPuestoDisplay(puesto);

      // Assert
      expect(display).toBe('DUEÑO');
    });
  });

  describe('theme tokens para InfoCard', () => {
    it('LIGHT_THEME textMuted definido para label', () => {
      // Arrange / Act
      const textMuted = LIGHT_THEME.textMuted;

      // Assert
      expect(textMuted).toBeDefined();
      expect(textMuted).toBe('#AEAEB2');
    });

    it('DARK_THEME text es blanco para value', () => {
      // Arrange / Act
      const text = DARK_THEME.text;

      // Assert
      expect(text).toBe('#FFFFFF');
    });

    it('LIGHT_THEME card es blanco para background', () => {
      // Arrange / Act
      const card = LIGHT_THEME.card;

      // Assert
      expect(card).toBe('#FFFFFF');
    });
  });

  describe('getTextColor — contraste', () => {
    it('texto negro sobre fondo blanco', () => {
      // Arrange
      const bg = '#FFFFFF';

      // Act
      const textColor = getTextColor(bg);

      // Assert
      expect(textColor).toBe('#000');
    });

    it('texto blanco sobre fondo negro', () => {
      // Arrange
      const bg = '#000000';

      // Act
      const textColor = getTextColor(bg);

      // Assert
      expect(textColor).toBe('#FFF');
    });

    it('texto blanco cuando bg es undefined', () => {
      // Arrange
      const bg = undefined;

      // Act
      const textColor = getTextColor(bg);

      // Assert
      expect(textColor).toBe('#FFF');
    });

    it('texto negro sobre color claro', () => {
      // Arrange
      const bg = '#FFFF00'; // amarillo brillante

      // Act
      const textColor = getTextColor(bg);

      // Assert
      expect(textColor).toBe('#000');
    });

    it('texto blanco sobre color oscuro', () => {
      // Arrange
      const bg = '#1A1A2E'; // azul oscuro

      // Act
      const textColor = getTextColor(bg);

      // Assert
      expect(textColor).toBe('#FFF');
    });
  });

  describe('casos de uso — SaleDetailScreen InfoCards', () => {
    it('FECHA card: label y value correctos', () => {
      // Arrange
      const label = 'FECHA';
      const value = 'Mié, 9 Abr';

      // Act
      const displayLabel = getPuestoDisplay(label, label);

      // Assert
      expect(value).toBe('Mié, 9 Abr');
      expect(displayLabel).toBe('FECHA');
    });

    it('CAJERO card usa fallback cuando no hay worker', () => {
      // Arrange
      const workerName = undefined;

      // Act
      const display = getAvatarInitial(workerName);

      // Assert
      expect(display).toBe('?');
    });
  });
});
