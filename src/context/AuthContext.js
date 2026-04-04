import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const PUESTOS = [
  'Administrador',
  'Cajero',
  'Cocinero',
  'Motorista',
  'Camarero',
];

export const PUESTO_ICONS = {
  'Administrador': 'shield-crown',
  'Cajero':        'cash-register',
  'Cocinero':      'chef-hat',
  'Motorista':     'moped',
  'Camarero':      'room-service',
};

export function AuthProvider({ children }) {
  const [isSetup, setIsSetup]           = useState(null);
  const [adminPin, setAdminPin]         = useState('');
  const [workers, setWorkers]           = useState([]);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [isAdminMode, setIsAdminMode]   = useState(false);

  useEffect(() => { loadAuth(); }, []);

  const loadAuth = async () => {
    try {
      const pin          = await AsyncStorage.getItem('ventasv_admin_pin');
      const savedWorkers = await AsyncStorage.getItem('ventasv_workers');
      if (pin) {
        setAdminPin(pin);
        setIsSetup(true);
        if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
      } else {
        setIsSetup(false);
      }
    } catch (e) {
      console.log('Auth load error', e);
      setIsSetup(false);
    }
  };

  const setupAdmin = async (pin, name) => {
    const admin = {
      id: 'admin',
      name: name || 'Administrador',
      pin,
      role: 'admin',
      puesto: 'Administrador',
      dui: '',
      photo: null,
      color: '#FFFFFF',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem('ventasv_admin_pin', pin);
    const newWorkers = [admin];
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    setAdminPin(pin);
    setIsSetup(true);
    return pin;
  };

  const selectWorker  = (worker) => worker;

  const loginWithPin = (pin, workerId) => {
    const worker = workers.find(w => w.id === workerId && w.pin === pin);
    if (worker) {
      setCurrentWorker(worker);
      setIsAdminMode(worker.role === 'admin');
      return worker;
    }
    return null;
  };

  const logout       = () => { setCurrentWorker(null); setIsAdminMode(false); };
  const switchWorker = () => { setCurrentWorker(null); setIsAdminMode(false); };

  const verifyAdminPin = (pin) => pin === adminPin;
  const enterAdminMode = (pin) => {
    if (verifyAdminPin(pin)) { setIsAdminMode(true); return true; }
    return false;
  };
  const exitAdminMode = () => setIsAdminMode(false);

  const addWorker = async (name, pin, puesto = 'Cajero', dui = '', photo = null) => {
    const exists = workers.find(w => w.pin === pin);
    if (exists) return { error: 'Ese PIN ya existe' };
    const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F'];
    const color  = colors[workers.length % colors.length];
    const worker = {
      id: Date.now().toString(),
      name,
      pin,
      role: 'worker',
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
    if (id === 'admin') return { error: 'No podés eliminar al admin' };
    const newWorkers = workers.filter(w => w.id !== id);
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    if (currentWorker?.id === id) setCurrentWorker(null);
    return { success: true };
  };

  const updateWorkerPin = async (id, newPin) => {
    const exists = workers.find(w => w.pin === newPin && w.id !== id);
    if (exists) return { error: 'Ese PIN ya existe' };
    const newWorkers = workers.map(w => w.id === id ? { ...w, pin: newPin } : w);
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    if (id === 'admin') {
      setAdminPin(newPin);
      await AsyncStorage.setItem('ventasv_admin_pin', newPin);
    }
    return { success: true };
  };

  const updateWorkerPhoto = async (id, photo) => {
    const newWorkers = workers.map(w => w.id === id ? { ...w, photo } : w);
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    if (currentWorker?.id === id) setCurrentWorker({ ...currentWorker, photo });
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      isSetup, currentWorker, workers, isAdminMode,
      setupAdmin, selectWorker, loginWithPin, logout, switchWorker,
      verifyAdminPin, enterAdminMode, exitAdminMode,
      addWorker, removeWorker, updateWorkerPin, updateWorkerPhoto,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);