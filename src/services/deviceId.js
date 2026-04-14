import AsyncStorage from '@react-native-async-storage/async-storage';
import { newId } from '../utils/ids';

const DEVICE_KEY = 'ventasv_device_id';
let cachedDeviceId = null;

export const getDeviceId = async () => {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = newId();
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  cachedDeviceId = id;
  return id;
};

export const resetDeviceId = async () => {
  const id = newId();
  await AsyncStorage.setItem(DEVICE_KEY, id);
  cachedDeviceId = id;
  return id;
};

export const _clearCache = () => { cachedDeviceId = null; };
