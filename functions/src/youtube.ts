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
