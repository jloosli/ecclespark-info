import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoisted mocks (available inside vi.mock factories) ---
const { mockInsert, mockBind, mockList, mockDelete, mockSetCredentials } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockBind: vi.fn(),
  mockList: vi.fn(),
  mockDelete: vi.fn(),
  mockSetCredentials: vi.fn(),
}));

vi.mock('googleapis', () => {
  class FakeOAuth2 {
    setCredentials = mockSetCredentials;
  }
  return {
    google: {
      youtube: vi.fn(() => ({
        liveBroadcasts: {
          insert: mockInsert,
          bind: mockBind,
          list: mockList,
          delete: mockDelete,
        },
      })),
      auth: {
        OAuth2: FakeOAuth2,
      },
    },
  };
});

// --- Import module under test ---
import { createYouTubeBroadcast, getYouTubeBroadcastStatus, deleteYouTubeBroadcast } from './youtube';

// --- Helpers ---

const credentials = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  refreshToken: 'test-refresh-token',
};

const baseParams = {
  title: 'Sunday Service',
  scheduledStartTime: '2026-04-01T10:00:00.000Z',
};

// --- Tests ---

describe('createYouTubeBroadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a broadcast and returns the result', async () => {
    mockInsert.mockResolvedValueOnce({
      data: {
        id: 'broadcast-abc',
        snippet: {
          scheduledStartTime: '2026-04-01T10:00:00.000Z',
          publishedAt: '2026-03-12T12:00:00.000Z',
        },
      },
    });

    const result = await createYouTubeBroadcast(credentials, baseParams);

    expect(result).toEqual({
      youtubeId: 'broadcast-abc',
      scheduledStartTime: '2026-04-01T10:00:00.000Z',
      publishedAt: '2026-03-12T12:00:00.000Z',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['snippet', 'status', 'contentDetails'],
        requestBody: expect.objectContaining({
          snippet: {
            title: 'Sunday Service',
            scheduledStartTime: '2026-04-01T10:00:00.000Z',
          },
          status: { privacyStatus: 'unlisted' },
        }),
      }),
    );

    expect(mockSetCredentials).toHaveBeenCalledWith({
      refresh_token: 'test-refresh-token',
    });
  });

  it('throws when YouTube API returns no broadcast ID', async () => {
    mockInsert.mockResolvedValueOnce({
      data: { id: null, snippet: {} },
    });

    await expect(
      createYouTubeBroadcast(credentials, baseParams),
    ).rejects.toThrow('YouTube API did not return a broadcast ID');
  });

  it('binds stream when streamId is provided', async () => {
    mockInsert.mockResolvedValueOnce({
      data: {
        id: 'broadcast-abc',
        snippet: {
          scheduledStartTime: '2026-04-01T10:00:00.000Z',
          publishedAt: '2026-03-12T12:00:00.000Z',
        },
      },
    });
    mockBind.mockResolvedValueOnce({});

    await createYouTubeBroadcast(credentials, {
      ...baseParams,
      streamId: 'stream-xyz',
    });

    expect(mockBind).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'broadcast-abc',
        part: ['id', 'contentDetails'],
        streamId: 'stream-xyz',
      }),
    );
  });

  it('skips bind when no streamId is provided', async () => {
    mockInsert.mockResolvedValueOnce({
      data: {
        id: 'broadcast-abc',
        snippet: {
          scheduledStartTime: '2026-04-01T10:00:00.000Z',
          publishedAt: '2026-03-12T12:00:00.000Z',
        },
      },
    });

    await createYouTubeBroadcast(credentials, baseParams);

    expect(mockBind).not.toHaveBeenCalled();
  });
});

describe('getYouTubeBroadcastStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns lifeCycleStatus when broadcast exists', async () => {
    mockList.mockResolvedValueOnce({
      data: {
        items: [{ status: { lifeCycleStatus: 'live' } }],
      },
    });

    const result = await getYouTubeBroadcastStatus(credentials, 'yt-123');
    expect(result).toBe('live');
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        part: ['status'],
        id: ['yt-123'],
      }),
    );
  });

  it('returns null when no items are returned', async () => {
    mockList.mockResolvedValueOnce({
      data: { items: [] },
    });

    const result = await getYouTubeBroadcastStatus(credentials, 'yt-missing');
    expect(result).toBeNull();
  });

  it('returns null when items is undefined', async () => {
    mockList.mockResolvedValueOnce({
      data: {},
    });

    const result = await getYouTubeBroadcastStatus(credentials, 'yt-missing');
    expect(result).toBeNull();
  });
});

describe('deleteYouTubeBroadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls liveBroadcasts.delete with correct params', async () => {
    mockDelete.mockResolvedValueOnce({});

    await deleteYouTubeBroadcast(credentials, 'yt-123');

    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'yt-123',
      }),
    );
  });

  it('propagates errors from the API', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Not found'));

    await expect(
      deleteYouTubeBroadcast(credentials, 'yt-missing'),
    ).rejects.toThrow('Not found');
  });
});
