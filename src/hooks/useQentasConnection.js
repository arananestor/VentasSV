import qentasClient from '../services/qentasClient';

export default function useQentasConnection() {
  return {
    isConnected: qentasClient.isConnected(),
    account: qentasClient.getAccount(),
    connect: qentasClient.connect,
    disconnect: qentasClient.disconnect,
  };
}
