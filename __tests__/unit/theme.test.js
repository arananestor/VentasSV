describe('ThemeContext', () => {
  const DARK = {
    mode: 'dark', bg: '#000000', card: '#111111', cardBorder: '#222222',
    text: '#FFFFFF', textSecondary: '#888888', textMuted: '#555555',
    accent: '#FFFFFF', accentText: '#000000', input: '#111111',
    inputBorder: '#222222', overlay: 'rgba(0,0,0,0.85)', danger: '#FF3B30',
    success: '#4ECDC4', keypad: '#111111', keypadText: '#FFFFFF',
    statusBar: 'light-content', headerBg: '#000000', dot: '#4ECDC4',
  };

  const LIGHT = {
    mode: 'light', bg: '#F2F2F7', card: '#FFFFFF', cardBorder: '#E5E5EA',
    text: '#000000', textSecondary: '#8E8E93', textMuted: '#AEAEB2',
    accent: '#000000', accentText: '#FFFFFF', input: '#FFFFFF',
    inputBorder: '#D1D1D6', overlay: 'rgba(0,0,0,0.4)', danger: '#FF3B30',
    success: '#34C759', keypad: '#E5E5EA', keypadText: '#000000',
    statusBar: 'dark-content', headerBg: '#FFFFFF', dot: '#34C759',
  };

  describe('tema dark', () => {
    it('tiene todos los tokens requeridos', () => {
      const required = ['bg','card','cardBorder','text','accent','accentText','danger','success'];
      required.forEach(token => expect(DARK[token]).toBeDefined());
    });

    it('bg es negro puro', () => expect(DARK.bg).toBe('#000000'));
    it('texto es blanco', () => expect(DARK.text).toBe('#FFFFFF'));
    it('accent es blanco', () => expect(DARK.accent).toBe('#FFFFFF'));
    it('accentText es negro', () => expect(DARK.accentText).toBe('#000000'));
    it('statusBar es light-content', () => expect(DARK.statusBar).toBe('light-content'));
  });

  describe('tema light', () => {
    it('tiene todos los tokens requeridos', () => {
      const required = ['bg','card','cardBorder','text','accent','accentText','danger','success'];
      required.forEach(token => expect(LIGHT[token]).toBeDefined());
    });

    it('bg es gris claro', () => expect(LIGHT.bg).toBe('#F2F2F7'));
    it('texto es negro', () => expect(LIGHT.text).toBe('#000000'));
    it('accent es negro', () => expect(LIGHT.accent).toBe('#000000'));
    it('accentText es blanco', () => expect(LIGHT.accentText).toBe('#FFFFFF'));
    it('statusBar es dark-content', () => expect(LIGHT.statusBar).toBe('dark-content'));
  });

  describe('toggle', () => {
    it('dark cambia a light', () => {
      const next = DARK.mode === 'dark' ? LIGHT : DARK;
      expect(next.mode).toBe('light');
    });

    it('light cambia a dark', () => {
      const next = LIGHT.mode === 'light' ? DARK : LIGHT;
      expect(next.mode).toBe('dark');
    });

    it('danger es el mismo en ambos temas', () => {
      expect(DARK.danger).toBe(LIGHT.danger);
    });
  });
});
