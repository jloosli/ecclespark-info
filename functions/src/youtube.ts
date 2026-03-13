import { google } from 'googleapis';

const youtube = google.youtube('v3');

export interface YouTubeCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface CreateBroadcastParams {
  title: string;
  scheduledStartTime: string;
  streamId?: string;
}

export interface YouTubeBroadcastResult {
  youtubeId: string;
  scheduledStartTime: string;
  publishedAt: string;
}

export async function createYouTubeBroadcast(
  credentials: YouTubeCredentials,
  params: CreateBroadcastParams,
): Promise<YouTubeBroadcastResult> {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });

  const broadcastResponse = await youtube.liveBroadcasts.insert({
    auth: oauth2Client,
    part: ['snippet', 'status', 'contentDetails'],
    requestBody: {
      snippet: {
        title: params.title,
        scheduledStartTime: params.scheduledStartTime,
      },
      status: {
        privacyStatus: 'unlisted',
      },
      contentDetails: {
        enableAutoStart: false,
        enableAutoStop: false,
      },
    },
  });

  const broadcast = broadcastResponse.data;
  const youtubeId = broadcast.id;
  if (!youtubeId) {
    throw new Error('YouTube API did not return a broadcast ID');
  }

  if (params.streamId) {
    await youtube.liveBroadcasts.bind({
      auth: oauth2Client,
      id: youtubeId,
      part: ['id', 'contentDetails'],
      streamId: params.streamId,
    });
  }

  return {
    youtubeId,
    scheduledStartTime:
      broadcast.snippet?.scheduledStartTime ?? params.scheduledStartTime,
    publishedAt:
      broadcast.snippet?.publishedAt ?? new Date().toISOString(),
  };
}

export async function getYouTubeBroadcastStatus(
  credentials: YouTubeCredentials,
  youtubeId: string,
): Promise<string | null> {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });

  const response = await youtube.liveBroadcasts.list({
    auth: oauth2Client,
    part: ['status'],
    id: [youtubeId],
  });

  const items = response.data.items;
  if (!items || items.length === 0) return null;

  return items[0].status?.lifeCycleStatus ?? null;
}

export async function deleteYouTubeBroadcast(
  credentials: YouTubeCredentials,
  youtubeId: string,
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });

  await youtube.liveBroadcasts.delete({
    auth: oauth2Client,
    id: youtubeId,
  });
}
