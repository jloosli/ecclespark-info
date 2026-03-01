import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

// Only initialize in the browser — avoids gRPC connections during SSG prerendering.
let db: Firestore | null = null;

if (typeof window !== 'undefined') {
  const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApps()[0];
  db = getFirestore(app);
}

export { db };
