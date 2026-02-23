import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isSetup, setIsSetup] = useState(null); // null = loading
  const [adminPin, setAdminPin] = useState('');
  const [workers, setWorkers] = useState([]);
  const [currentWorker, setCurrentWorker] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const pin = await AsyncStorage.getItem('ventasv_admin_pin');
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
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem('ventasv_admin_pin', pin);
    const newWorkers = [admin];
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));
    setAdminPin(pin);
    setCurrentWorker(admin);
    setIsSetup(true);
    return pin;
  };

  const loginWithPin = (pin) => {
    const worker = workers.find(w => w.pin === pin);
    if (worker) {
      setCurrentWorker(worker);
      setIsAdminMode(worker.role === 'admin');
      return worker;
    }
    return null;
  };

  const logout = () => {
    setCurrentWorker(null);
    setIsAdminMode(false);
  };

  const verifyAdminPin = (pin) => {
    return pin === adminPin;
  };

  const enterAdminMode = (pin) => {
    if (verifyAdminPin(pin)) {
      setIsAdminMode(true);
      return true;
    }
    return false;
  };

  const exitAdminMode = () => {
    setIsAdminMode(false);
  };

  const addWorker = async (name, pin) => {
    const exists = workers.find(w => w.pin === pin);
    if (exists) return { error: 'Ese PIN ya existe' };

    const worker = {
      id: Date.now().toString(),
      name,
      pin,
      role: 'worker',
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
    return { success: true };
  };

  const updateWorkerPin = async (id, newPin) => {
    const exists = workers.find(w => w.pin === newPin && w.id !== id);
    if (exists) return { error: 'Ese PIN ya existe' };

    const newWorkers = workers.map(w =>
      w.id === id ? { ...w, pin: newPin } : w
    );
    setWorkers(newWorkers);
    await AsyncStorage.setItem('ventasv_workers', JSON.stringify(newWorkers));

    if (id === 'admin') {
      setAdminPin(newPin);
      await AsyncStorage.setItem('ventasv_admin_pin', newPin);
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      isSetup,
      currentWorker,
      workers,
      isAdminMode,
      setupAdmin,
      loginWithPin,
      logout,
      verifyAdminPin,
      enterAdminMode,
      exitAdminMode,
      addWorker,
      removeWorker,
      updateWorkerPin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);