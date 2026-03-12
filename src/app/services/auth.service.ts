import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);

  readonly authState = signal<User | null | false>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId) && auth) {
      onAuthStateChanged(auth, (user) => {
        this.authState.set(user);
      });
    } else {
      this.authState.set(null);
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (!auth) throw new Error('Auth not initialized');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
}
