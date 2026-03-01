import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { EMPTY, Observable } from 'rxjs';
import { db } from '../firebase';
import { Stream } from '../models/stream';

@Injectable({ providedIn: 'root' })
export class StreamsService {
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  getActiveStreams(): Observable<Stream[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const activeQuery = query(
      collection(db!, 'streams'),
      where('status', 'in', ['SCHEDULED', 'LIVE']),
      orderBy('scheduled_at', 'desc'),
    );

    return new Observable<Stream[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        activeQuery,
        (snapshot) => {
          const streams = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Stream, 'id'>),
          }));
          this.ngZone.run(() => subscriber.next(streams));
        },
        (error) => {
          this.ngZone.run(() => subscriber.error(error));
        },
      );
      return unsubscribe;
    });
  }

  async createStream(data: {
    title: string;
    youtubeId: string;
    scheduledAt: Date;
  }): Promise<string> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Cannot write to Firestore on the server');
    }
    const docRef = await addDoc(collection(db!, 'streams'), {
      title: data.title,
      youtube_id: data.youtubeId,
      scheduled_at: Timestamp.fromDate(data.scheduledAt),
      status: 'SCHEDULED',
      created_at: serverTimestamp(),
    });
    return docRef.id;
  }
}
