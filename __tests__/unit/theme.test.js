import { LIGHT_THEME, DARK_THEME } from '../../src/context/ThemeContext';
import { getTextColor } from '../../src/utils/colorUtils';

describe('DARK_THEME', () => {
  it('tiene todos los tokens requeridos', () => {
    // Arrange
    const required = ['bg', 'card', 'cardBorder', 'text', 'accent', 'accentText', 'danger', 'success'];

    // Act
    const missing = required.filter(token => !DARK_THEME[token]);

    // Assert
    expect(missing).toHaveLength(0);
  });

  it('bg es negro puro', () => {
    // Arrange / Act
    const bg = DARK_THEME.bg;

    // Assert
    expect(bg).toBe('#000000');
  });

  it('texto es blanco', () => {
    // Arrange / Act
    const text = DARK_THEME.text;

    // Assert
    expect(text).toBe('#FFFFFF');
  });

  it('accent es blanco', () => {
    // Arrange / Act
    const accent = DARK_THEME.accent;

    // Assert
    expect(accent).toBe('#FFFFFF');
  });

  it('accentText es negro', () => {
    // Arrange / Act
    const accentText = DARK_THEME.accentText;

    // Assert
    expect(accentText).toBe('#000000');
  });

  it('statusBar es light-content', () => {
    // Arrange / Act
    const statusBar = DARK_THEME.statusBar;

    // Assert
    expect(statusBar).toBe('light-content');
  });

  it('mode es dark', () => {
    // Arrange / Act
    const mode = DARK_THEME.mode;

    // Assert
    expect(mode).toBe('dark');
  });

  it('headerBg es negro', () => {
    // Arrange / Act
    const headerBg = DARK_THEME.headerBg;

    // Assert
    expect(headerBg).toBe('#000000');
  });
});

describe('LIGHT_THEME', () => {
  it('tiene todos los tokens requeridos', () => {
    // Arrange
    const required = ['bg', 'card', 'cardBorder', 'text', 'accent', 'accentText', 'danger', 'success'];

    // Act
    const missing = required.filter(token => !LIGHT_THEME[token]);

    // Assert
    expect(missing).toHaveLength(0);
  });

  it('bg es gris claro', () => {
    // Arrange / Act
    const bg = LIGHT_THEME.bg;

    // Assert
    expect(bg).toBe('#F2F2F7');
  });

  it('texto es negro', () => {
    // Arrange / Act
    const text = LIGHT_THEME.text;

    // Assert
    expect(text).toBe('#000000');
  });

  it('accent es negro', () => {
    // Arrange / Act
    const accent = LIGHT_THEME.accent;

    // Assert
    expect(accent).toBe('#000000');
  });

  it('accentText es blanco', () => {
    // Arrange / Act
    const accentText = LIGHT_THEME.accentText;

    // Assert
    expect(accentText).toBe('#FFFFFF');
  });

  it('statusBar es dark-content', () => {
    // Arrange / Act
    const statusBar = LIGHT_THEME.statusBar;

    // Assert
    expect(statusBar).toBe('dark-content');
  });

  it('mode es light', () => {
    // Arrange / Act
    const mode = LIGHT_THEME.mode;

    // Assert
    expect(mode).toBe('light');
  });
});

describe('toggle entre temas', () => {
  it('dark cambia a light al hacer toggle', () => {
    // Arrange
    const currentTheme = DARK_THEME;

    // Act
    const next = currentTheme.mode === 'dark' ? LIGHT_THEME : DARK_THEME;

    // Assert
    expect(next.mode).toBe('light');
  });

  it('light cambia a dark al hacer toggle', () => {
    // Arrange
    const currentTheme = LIGHT_THEME;

    // Act
    const next = currentTheme.mode === 'light' ? DARK_THEME : LIGHT_THEME;

    // Assert
    expect(next.mode).toBe('dark');
  });

  it('danger es el mismo valor en ambos temas', () => {
    // Arrange / Act
    const darkDanger = DARK_THEME.danger;
    const lightDanger = LIGHT_THEME.danger;

    // Assert
    expect(darkDanger).toBe(lightDanger);
  });

  it('los temas tienen valores mode diferentes', () => {
    // Arrange / Act
    const darkMode = DARK_THEME.mode;
    const lightMode = LIGHT_THEME.mode;

    // Assert
    expect(darkMode).not.toBe(lightMode);
  });
});

describe('getTextColor — contraste basado en tema', () => {
  it('texto oscuro sobre bg del LIGHT_THEME (gris claro)', () => {
    // Arrange
    const bg = LIGHT_THEME.bg; // '#F2F2F7'

    // Act
    const textColor = getTextColor(bg);

    // Assert
    expect(textColor).toBe('#000');
  });

  it('texto claro sobre card del DARK_THEME', () => {
    // Arrange
    const bg = DARK_THEME.card; // '#111111'

    // Act
    const textColor = getTextColor(bg);

    // Assert
    expect(textColor).toBe('#FFF');
  });

  it('texto claro sobre bg negro del DARK_THEME', () => {
    // Arrange
    const bg = DARK_THEME.bg; // '#000000'

    // Act
    const textColor = getTextColor(bg);

    // Assert
    expect(textColor).toBe('#FFF');
  });
});
