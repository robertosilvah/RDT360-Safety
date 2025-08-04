import { getBackendMode } from '@/lib/backend-config';
import * as firebaseAPI from './firebase-service';
import * as mariaDBAPI from './mariadb-service';

// This logic runs when the module is imported.
// On the client-side, it will correctly read from localStorage.
// On the server-side, it will default to 'firebase' as localStorage is not available.
const isClient = typeof window !== 'undefined';
const mode = isClient ? getBackendMode() : 'firebase';

const api = mode === "firebase" ? firebaseAPI : mariaDBAPI;

export default api;
