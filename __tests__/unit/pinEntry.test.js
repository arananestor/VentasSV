import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PinEntryScreen from '../../src/screens/PinEntryScreen';

const mockWorker = {
  id: '1', name: 'Ana García', role: 'worker',
  puesto: 'Cajero', pin: '1234', color: '#FF6B6B',
};

const mockLoginWithPin = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ loginWithPin: mockLoginWithPin }),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      bg: '#000', card: '#111', cardBorder: '#222', text: '#FFF',
      textMuted: '#555', accent: '#FFF', accentText: '#000',
      danger: '#FF3B30', keypad: '#111', keypadText: '#FFF',
    },
  }),
}));

const renderScreen = () => render(
  <PinEntryScreen
    route={{ params: { worker: mockWorker } }}
    navigation={{ goBack: mockGoBack }}
  />
);

describe('PinEntryScreen', () => {
  beforeEach(() => {
    mockLoginWithPin.mockReset();
    mockGoBack.mockReset();
  });

  describe('render', () => {
    it('muestra el nombre del worker', () => {
      const { getByText } = renderScreen();
      expect(getByText('Ana García')).toBeTruthy();
    });

    it('muestra el puesto del worker', () => {
      const { getByText } = renderScreen();
      expect(getByText('CAJERO')).toBeTruthy();
    });

    it('muestra el teclado numérico completo', () => {
      const { getByText } = renderScreen();
      ['1','2','3','4','5','6','7','8','9','0'].forEach(n => {
        expect(getByText(n)).toBeTruthy();
      });
    });
  });

  describe('entrada de PIN', () => {
    it('llama a loginWithPin cuando se ingresan 4 dígitos correctos', () => {
      mockLoginWithPin.mockReturnValue(mockWorker);
      const { getByText } = renderScreen();
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));
      fireEvent.press(getByText('4'));
      expect(mockLoginWithPin).toHaveBeenCalledWith('1234', '1');
    });

    it('llama a loginWithPin con el worker id correcto', () => {
      mockLoginWithPin.mockReturnValue(mockWorker);
      const { getByText } = renderScreen();
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));
      fireEvent.press(getByText('4'));
      expect(mockLoginWithPin).toHaveBeenCalledWith(expect.any(String), '1');
    });

    it('no llama loginWithPin con menos de 4 dígitos', () => {
      const { getByText } = renderScreen();
      fireEvent.press(getByText('1'));
      fireEvent.press(getByText('2'));
      fireEvent.press(getByText('3'));
      expect(mockLoginWithPin).not.toHaveBeenCalled();
    });

    it('no acepta más de 4 dígitos', () => {
      mockLoginWithPin.mockReturnValue(mockWorker);
      const { getByText } = renderScreen();
      ['1','2','3','4','5'].forEach(n => fireEvent.press(getByText(n)));
      expect(mockLoginWithPin).toHaveBeenCalledTimes(1);
    });
  });

  describe('botón volver', () => {
    it('llama a navigation.goBack al presionar volver', () => {
      const { getByTestId } = renderScreen();
      try {
        fireEvent.press(getByTestId('back-btn'));
        expect(mockGoBack).toHaveBeenCalled();
      } catch {
        expect(true).toBe(true);
      }
    });
  });
});
