import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';

export default function useCan(action) {
  const { currentWorker } = useAuth();
  return can(currentWorker, action);
}
