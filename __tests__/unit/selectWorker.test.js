import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SelectWorkerScreen from '../../src/screens/SelectWorkerScreen';

const mockNavigate = jest.fn();
const mockWorkers = [
  { id: 'owner', name: 'Carlos López', role: 'owner', puesto: 'Dueño', pin: '1234', color: '#FFFFFF' },
  { id: '1', name: 'Ana García', role: 'worker', puesto: 'Cajero', pin: '5678', color: '#FF6B6B' },
  { id: '2', name: 'Luis Ramos', role: 'worker', puesto: 'Cocinero', pin: '9012', color: '#4ECDC4' },
];

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ workers: mockWorkers }),
  PUESTO_ICONS: {
    'Dueño': 'crown', 'Cajero': 'cash-register',
    'Cocinero': 'chef-hat', 'Motorista': 'moped', 'Camarero': 'room-service',
  },
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      bg: '#000', card: '#111', cardBorder: '#222', text: '#FFF',
      textMuted: '#555', textSecondary: '#888', accent: '#FFF', accentText: '#000',
      statusBar: 'light-content',
    },
  }),
}));

describe('SelectWorkerScreen', () => {
  beforeEach(() => mockNavigate.mockReset());

  const renderScreen = () => render(
    <SelectWorkerScreen navigation={{ navigate: mockNavigate }} />
  );

  describe('render', () => {
    it('muestra todos los workers', () => {
      const { getByText } = renderScreen();
      expect(getByText('Carlos López')).toBeTruthy();
      expect(getByText('Ana García')).toBeTruthy();
      expect(getByText('Luis Ramos')).toBeTruthy();
    });

    it('muestra el puesto de cada worker', () => {
      const { getByText } = renderScreen();
      expect(getByText('DUEÑO')).toBeTruthy();
      expect(getByText('CAJERO')).toBeTruthy();
      expect(getByText('COCINERO')).toBeTruthy();
    });

    it('muestra el header de la app', () => {
      const { getByText } = renderScreen();
      expect(getByText('VENTASSV')).toBeTruthy();
    });
  });

  describe('navegación', () => {
    it('navega a PinEntry al tocar un worker', () => {
      const { getByText } = renderScreen();
      fireEvent.press(getByText('Ana García'));
      expect(mockNavigate).toHaveBeenCalledWith('PinEntry', { worker: mockWorkers[1] });
    });

    it('navega a PinEntry con el worker correcto', () => {
      const { getByText } = renderScreen();
      fireEvent.press(getByText('Carlos López'));
      expect(mockNavigate).toHaveBeenCalledWith('PinEntry', { worker: mockWorkers[0] });
    });
  });
});
