import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { createYouTubeBroadcast, getYouTubeBroadcastStatus, deleteYouTubeBroadcast } from './youtube';
import type {
  CreateBroadcastRequest,
  CreateBroadcastResponse,
  DeleteBroadcastRequest,
  DeleteBroadcastResponse,
} from './types';

initializeApp();
const db = getFirestore();

const youtubeOwnerRefreshToken = defineSecret('YOUTUBE_OWNER_REFRESH_TOKEN');
const youtubeClientId = defineSecret('YOUTUBE_CLIENT_ID');
const youtubeClientSecret = defineSecret('YOUTUBE_CLIENT_SECRET');
const youtubeStreamId = defineSecret('YOUTUBE_STREAM_ID');

export const createBroadcast = onCall(
  {
    secrets: [
      youtubeOwnerRefreshToken,
      youtubeClientId,
      youtubeClientSecret,
      youtubeStreamId,
    ],
    region: 'us-central1',
    maxInstances: 5,
  },
  async (request): Promise<CreateBroadcastResponse> => {
    // 1. Verify caller is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to create a broadcast.',
      );
    }

    const callerEmail = request.auth.token.email;
    if (!callerEmail) {
      throw new HttpsError(
        'unauthenticated',
        'No email associated with this account.',
      );
    }

    // 2. Check allowlist
    const allowDoc = await db
      .collection('allowed_users')
      .doc(callerEmail)
      .get();
    if (!allowDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'Your account is not authorized to create broadcasts.',
      );
    }

    // 3. Validate request data
    const data = request.data as CreateBroadcastRequest;
    if (
      !data.title ||
      typeof data.title !== 'string' ||
      data.title.trim().length === 0
    ) {
      throw new HttpsError('invalid-argument', 'Title is required.');
    }
    if (
      !data.scheduledStartTime ||
      typeof data.scheduledStartTime !== 'string'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Scheduled start time is required.',
      );
    }
    const scheduledDate = new Date(data.scheduledStartTime);
    if (isNaN(scheduledDate.getTime())) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid scheduled start time format.',
      );
    }

    // 4. Create YouTube broadcast using owner's refresh token
    let result;
    try {
      result = await createYouTubeBroadcast(
        {
          clientId: youtubeClientId.value(),
          clientSecret: youtubeClientSecret.value(),
          refreshToken: youtubeOwnerRefreshToken.value(),
        },
        {
          title: data.title.trim(),
          scheduledStartTime: scheduledDate.toISOString(),
          streamId: youtubeStreamId.value() || undefined,
        },
      );
    } catch (err) {
      console.error('YouTube API error:', err);
      throw new HttpsError(
        'internal',
        'Failed to create YouTube broadcast. Please try again later.',
      );
    }

    // 5. Write stream document to Firestore
    const streamDoc = await db.collection('streams').add({
      title: data.title.trim(),
      youtube_id: result.youtubeId,
      scheduled_at: Timestamp.fromDate(scheduledDate),
      status: 'SCHEDULED',
      created_at: FieldValue.serverTimestamp(),
      created_by: callerEmail,
    });

    return {
      youtubeId: result.youtubeId,
      scheduledStartTime: result.scheduledStartTime,
      publishedAt: result.publishedAt,
      watchUrl: `https://www.youtube.com/watch?v=${result.youtubeId}`,
      firestoreId: streamDoc.id,
    };
  },
);

export const deleteBroadcast = onCall(
  {
    secrets: [
      youtubeOwnerRefreshToken,
      youtubeClientId,
      youtubeClientSecret,
    ],
    region: 'us-central1',
    maxInstances: 5,
  },
  async (request): Promise<DeleteBroadcastResponse> => {
    // 1. Verify caller is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to delete a broadcast.',
      );
    }

    const callerEmail = request.auth.token.email;
    if (!callerEmail) {
      throw new HttpsError(
        'unauthenticated',
        'No email associated with this account.',
      );
    }

    // 2. Check allowlist
    const allowDoc = await db
      .collection('allowed_users')
      .doc(callerEmail)
      .get();
    if (!allowDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'Your account is not authorized to delete broadcasts.',
      );
    }

    // 3. Validate request data
    const data = request.data as DeleteBroadcastRequest;
    if (!data.firestoreId || typeof data.firestoreId !== 'string') {
      throw new HttpsError('invalid-argument', 'Firestore document ID is required.');
    }

    // 4. Look up Firestore doc and verify status
    const streamDoc = await db.collection('streams').doc(data.firestoreId).get();
    if (!streamDoc.exists) {
      throw new HttpsError('not-found', 'Broadcast not found.');
    }

    const streamData = streamDoc.data()!;
    if (streamData.status !== 'SCHEDULED') {
      throw new HttpsError(
        'failed-precondition',
        'Only scheduled broadcasts can be deleted.',
      );
    }

    // 5. Delete YouTube broadcast (swallow 404)
    const youtubeId = streamData.youtube_id;
    if (youtubeId) {
      try {
        await deleteYouTubeBroadcast(
          {
            clientId: youtubeClientId.value(),
            clientSecret: youtubeClientSecret.value(),
            refreshToken: youtubeOwnerRefreshToken.value(),
          },
          youtubeId,
        );
      } catch (err: unknown) {
        const status = (err as { code?: number }).code;
        if (status !== 404) {
          console.error(`Failed to delete YouTube broadcast ${youtubeId}:`, err);
          throw new HttpsError(
            'internal',
            'Failed to delete YouTube broadcast. Please try again later.',
          );
        }
      }
    }

    // 6. Delete Firestore document
    await streamDoc.ref.delete();

    return { deleted: true };
  },
);

export const manageStreamStatuses = onSchedule(
  {
    schedule: '0 11 * * *',
    timeZone: 'America/Denver',
    secrets: [youtubeOwnerRefreshToken, youtubeClientId, youtubeClientSecret],
    region: 'us-central1',
    maxInstances: 1,
  },
  async () => {
    const now = Timestamp.now();
    const twentyFourHoursAgo = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
    const sixDaysAgo = Timestamp.fromMillis(now.toMillis() - 6 * 24 * 60 * 60 * 1000);

    const credentials = {
      clientId: youtubeClientId.value(),
      clientSecret: youtubeClientSecret.value(),
      refreshToken: youtubeOwnerRefreshToken.value(),
    };

    // Pass 1: Promote SCHEDULED → BROADCAST where YouTube says live/complete/testing
    const scheduledSnap = await db
      .collection('streams')
      .where('status', '==', 'SCHEDULED')
      .where('scheduled_at', '<=', now)
      .get();

    for (const doc of scheduledSnap.docs) {
      const youtubeId = doc.data().youtube_id;
      if (!youtubeId) continue;

      try {
        const ytStatus = await getYouTubeBroadcastStatus(credentials, youtubeId);
        if (ytStatus === 'live' || ytStatus === 'complete' || ytStatus === 'testing') {
          await doc.ref.update({ status: 'BROADCAST' });
          console.log(`Promoted ${doc.id} to BROADCAST (YouTube: ${ytStatus})`);
        }
      } catch (err) {
        console.error(`Failed to check YouTube status for ${doc.id}:`, err);
      }
    }

    // Pass 2: Delete stale SCHEDULED (>24h past scheduled_at, not broadcast)
    const staleSnap = await db
      .collection('streams')
      .where('status', '==', 'SCHEDULED')
      .where('scheduled_at', '<=', twentyFourHoursAgo)
      .get();

    for (const doc of staleSnap.docs) {
      const youtubeId = doc.data().youtube_id;
      if (youtubeId) {
        try {
          await deleteYouTubeBroadcast(credentials, youtubeId);
        } catch (err: unknown) {
          const status = (err as { code?: number }).code;
          if (status !== 404) {
            console.error(`Failed to delete YouTube broadcast ${youtubeId}:`, err);
          }
        }
      }
      await doc.ref.delete();
      console.log(`Deleted stale SCHEDULED stream ${doc.id}`);
    }

    // Pass 3: Archive old BROADCAST (≥6 days past scheduled_at)
    const oldBroadcastSnap = await db
      .collection('streams')
      .where('status', '==', 'BROADCAST')
      .where('scheduled_at', '<=', sixDaysAgo)
      .get();

    for (const doc of oldBroadcastSnap.docs) {
      await doc.ref.update({ status: 'ARCHIVED' });
      console.log(`Archived stream ${doc.id}`);
    }
  },
);
