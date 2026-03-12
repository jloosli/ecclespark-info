import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createYouTubeBroadcast } from './youtube';
import type { CreateBroadcastRequest, CreateBroadcastResponse } from './types';

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
