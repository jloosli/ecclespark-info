import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { EMPTY, Observable } from 'rxjs';
import { db } from '../firebase';
import { Announcement } from '../models/announcement';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  getActiveAnnouncements(): Observable<Announcement[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }

    const activeQuery = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('created_at', 'desc'),
    );

    return new Observable<Announcement[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        activeQuery,
        (snapshot) => {
          const announcements = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Announcement, 'id'>),
          }));
          this.ngZone.run(() => subscriber.next(announcements));
        },
        (error) => {
          this.ngZone.run(() => subscriber.error(error));
        },
      );
      return unsubscribe;
    });
  }
}
