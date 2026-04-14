import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from '../services/deviceId';
import { attachEnvelope } from '../utils/entityEnvelope';

const STORAGE_KEYS = {
  sales: 'ventasv_sales',
  products: 'ventasv_products',
  workers: 'ventasv_workers',
  tabs: 'ventasv_tabs',
  businessConfig: 'business_bank_config',
  schemaVersion: 'ventasv_schema_version',
};

let deviceId = null;

const init = async () => {
  deviceId = await getDeviceId();
  return deviceId;
};

const getAll = async (collectionName) => {
  const key = STORAGE_KEYS[collectionName];
  if (!key) throw new Error(`Unknown collection: ${collectionName}`);
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

const save = async (collectionName, value) => {
  const key = STORAGE_KEYS[collectionName];
  if (!key) throw new Error(`Unknown collection: ${collectionName}`);
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const upsert = async (collectionName, entity) => {
  const enveloped = attachEnvelope(entity, { deviceId });
  const collection = await getAll(collectionName);
  const idx = collection.findIndex(e => e.id === enveloped.id);
  if (idx >= 0) {
    collection[idx] = enveloped;
  } else {
    collection.push(enveloped);
  }
  await save(collectionName, collection);
  return enveloped;
};

const remove = async (collectionName, entityId) => {
  const collection = await getAll(collectionName);
  const filtered = collection.filter(e => e.id !== entityId);
  await save(collectionName, filtered);
};

export { STORAGE_KEYS, init, getAll, save, upsert, remove };
