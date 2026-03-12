import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '../environments/environment';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(environment.firebase) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export { app, db, auth };
