import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const PUESTOS = ['Encargado', 'Cajero', 'Cocinero', 'Motorista', 'Camarero'];

export const PUESTO_ICONS = {
  'Dueño':             'crown',
  'Encargado':         'shield-account',
  'Cajero':            'cash-register',
  'Cocinero':          'chef-hat',
  'Motorista':         'moped',
  'Camarero':          'room-service',
};

export const generatePin = () => String(Math.floor(1000 + Math.random() * 9000));

export function AuthProvider({ children }) {
  const [isSetup, setIsSetup]             = useState(null);
  const [workers, setWorkers]             = useState([]);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [deviceType, setDeviceType]       = useState(null); // 'fixed' | 'personal'

  useEffect(() => { loadAuth(); }, []);

  const loadAuth = async () => {
    try {
      const savedWorkers = await AsyncStorage.getItem('ventasv_workers');
      const savedDevice  = await AsyncStorage.getItem('ventasv_device_type');
      if (savedWorkers) {
        const parsed = JSON.parse(savedWorkers);
        setWorkers(parsed);
        setIsSetup(true);
      } else {
        setIsSetup(false);
      }
      if (savedDevice) setDeviceType(savedDevice);
    } catch (e) {
      console.log('Auth load error', e);
      setIsSetup(false);
    }
  };

  const setupOwner = async (pin, name, device) => {
    const owner = {
      id: 'owner',
      name: name.trim(),
      pin,
      role: 'owner',
      puesto: 'Dueño',
      dui: '',
      photo: null,
      color: '#FFFFFF',
      createdAt: new Date().toISOString(),
    };
    const newWorkers = [owner];
    setWorkers(newWorkers);
    setDeviceType(device);
    setIsSetup(true);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    await AsyncStorage.setItem('ventasv_device_type', device);
  };

  const loginWithPin = (pin, workerId) => {
    const worker = workers.find(w => w.id === workerId && w.pin === pin);
    if (worker) { setCurrentWorker(worker); return worker; }
    return null;
  };

  const logout       = () => setCurrentWorker(null);
  const switchWorker = () => setCurrentWorker(null);

  const verifyOwnerPin = (pin) => {
    const owner = workers.find(w => w.role === 'owner');
    return owner?.pin === pin;
  };

  const isAdmin = (worker) =>
    worker?.role === 'owner' || worker?.role === 'co-admin';

  const addWorker = async (name, pin, puesto = 'Cajero', dui = '', photo = null) => {
    if (pin.length !== 4)           return { error: 'El PIN debe ser exactamente 4 dígitos' };
    if (!/^\d{4}$/.test(pin))       return { error: 'El PIN debe ser 4 dígitos numéricos' };
    const exists = workers.find(w => w.pin === pin);
    if (exists)                     return { error: 'Ese PIN ya existe' };

    const role   = puesto === 'Encargado' ? 'co-admin' : 'worker';
    const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F'];
    const color  = colors[workers.length % colors.length];
    const worker = {
      id: Date.now().toString(),
      name: name.trim(),
      pin,
      role,
      puesto,
      dui,
      photo,
      color,
      createdAt: new Date().toISOString(),
    };
    const newWorkers = [...workers, worker];
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    return { success: true, worker };
  };

  const removeWorker = async (id) => {
    if (id === 'owner') return { error: 'No podés eliminar al dueño' };
    const newWorkers = workers.filter(w => w.id !== id);
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    if (currentWorker?.id === id) setCurrentWorker(null);
    return { success: true };
  };

  const resetWorkerPin = async (id, newPin) => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin))
      return { error: 'El PIN debe ser 4 dígitos' };
    const exists = workers.find(w => w.pin === newPin && w.id !== id);
    if (exists) return { error: 'Ese PIN ya existe' };
    const newWorkers = workers.map(w => w.id === id ? { ...w, pin: newPin } : w);
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    return { success: true };
  };

  const updateWorkerPhoto = async (id, photo) => {
    const newWorkers = workers.map(w => w.id === id ? { ...w, photo } : w);
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    if (currentWorker?.id === id) setCurrentWorker(prev => ({ ...prev, photo }));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      isSetup, currentWorker, workers, deviceType,
      setupOwner, loginWithPin, logout, switchWorker,
      verifyOwnerPin, isAdmin,
      addWorker, removeWorker, resetWorkerPin, updateWorkerPhoto,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);