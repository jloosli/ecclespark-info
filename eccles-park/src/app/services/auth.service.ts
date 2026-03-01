import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  GoogleAuthProvider,
  OAuthCredential,
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

  async signInWithGoogle(): Promise<{ credential: OAuthCredential; accessToken: string }> {
    if (!auth) throw new Error('Auth not initialized');
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/youtube.force-ssl');
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential || !credential.accessToken) {
      throw new Error('Failed to get Google credential');
    }
    return { credential, accessToken: credential.accessToken };
  }
}
