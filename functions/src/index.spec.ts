import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoisted mocks ---
const {
  mockGet,
  mockDoc,
  mockCollection,
  mockAdd,
  mockStreamsCollection,
  mockCreateYouTubeBroadcast,
  MockHttpsError,
  capturedHandlerRef,
} = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockDoc = vi.fn(() => ({ get: mockGet }));
  const mockCollection = vi.fn((_name?: string) => ({ doc: mockDoc }));
  const mockAdd = vi.fn();
  const mockStreamsCollection = vi.fn((_name?: string) => ({ add: mockAdd }));
  const mockCreateYouTubeBroadcast = vi.fn();

  class MockHttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  }

  const capturedHandlerRef: { current: ((request: unknown) => Promise<unknown>) | null } = {
    current: null,
  };

  return {
    mockGet,
    mockDoc,
    mockCollection,
    mockAdd,
    mockStreamsCollection,
    mockCreateYouTubeBroadcast,
    MockHttpsError,
    capturedHandlerRef,
  };
});

// --- Mocks ---

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: (name: string) => {
      if (name === 'allowed_users') return mockCollection(name);
      if (name === 'streams') return mockStreamsCollection(name);
      return mockCollection(name);
    },
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  },
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({
      toDate: () => d,
      _seconds: Math.floor(d.getTime() / 1000),
    })),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((_opts: unknown, handler: (request: unknown) => Promise<unknown>) => {
    capturedHandlerRef.current = handler;
    return 'mocked-cloud-function';
  }),
  HttpsError: MockHttpsError,
}));

vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn((name: string) => ({
    value: () => `mock-${name}`,
  })),
}));

vi.mock('./youtube', () => ({
  createYouTubeBroadcast: mockCreateYouTubeBroadcast,
}));

// --- Import module under test (triggers onCall capture) ---
import './index';

// --- Helpers ---

function handler() {
  if (!capturedHandlerRef.current) {
    throw new Error('Handler was not captured — onCall mock not invoked');
  }
  return capturedHandlerRef.current;
}

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      uid: 'user123',
      token: { email: 'test@example.com' },
    },
    data: {
      title: 'Sunday Service',
      scheduledStartTime: '2026-04-01T10:00:00Z',
    },
    ...overrides,
  };
}

// --- Tests ---

describe('createBroadcast onCall handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws unauthenticated when request.auth is null', async () => {
    const request = makeRequest({ auth: null });
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
  });

  it('throws unauthenticated when email is missing', async () => {
    const request = makeRequest({
      auth: { uid: 'user123', token: {} },
    });
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
  });

  it('throws permission-denied when user is not on allowlist', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const request = makeRequest();
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' }),
    );
  });

  it('throws invalid-argument for missing title', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeRequest({
      data: { title: '', scheduledStartTime: '2026-04-01T10:00:00Z' },
    });
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws invalid-argument for missing scheduledStartTime', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeRequest({
      data: { title: 'Sunday Service', scheduledStartTime: '' },
    });
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws invalid-argument for invalid date format', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeRequest({
      data: { title: 'Sunday Service', scheduledStartTime: 'not-a-date' },
    });
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws internal when YouTube API fails', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockCreateYouTubeBroadcast.mockRejectedValueOnce(new Error('YouTube API down'));

    const request = makeRequest();
    await expect(handler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'internal' }),
    );
  });

  it('returns correct response on success', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockCreateYouTubeBroadcast.mockResolvedValueOnce({
      youtubeId: 'yt-123',
      scheduledStartTime: '2026-04-01T10:00:00.000Z',
      publishedAt: '2026-03-12T00:00:00.000Z',
    });
    mockAdd.mockResolvedValueOnce({ id: 'firestore-doc-456' });

    const request = makeRequest();
    const result = await handler()(request);

    expect(result).toEqual({
      youtubeId: 'yt-123',
      scheduledStartTime: '2026-04-01T10:00:00.000Z',
      publishedAt: '2026-03-12T00:00:00.000Z',
      watchUrl: 'https://www.youtube.com/watch?v=yt-123',
      firestoreId: 'firestore-doc-456',
    });

    // Verify Firestore write
    expect(mockStreamsCollection).toHaveBeenCalledWith('streams');
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sunday Service',
        youtube_id: 'yt-123',
        status: 'SCHEDULED',
        created_by: 'test@example.com',
      }),
    );

    // Verify YouTube API called with correct credentials
    expect(mockCreateYouTubeBroadcast).toHaveBeenCalledWith(
      {
        clientId: 'mock-YOUTUBE_CLIENT_ID',
        clientSecret: 'mock-YOUTUBE_CLIENT_SECRET',
        refreshToken: 'mock-YOUTUBE_OWNER_REFRESH_TOKEN',
      },
      {
        title: 'Sunday Service',
        scheduledStartTime: '2026-04-01T10:00:00.000Z',
        streamId: 'mock-YOUTUBE_STREAM_ID',
      },
    );
  });
});
