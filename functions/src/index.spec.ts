import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoisted mocks ---
const {
  mockGet,
  mockDoc,
  mockCollection,
  mockAdd,
  mockWhere,
  mockWhereGet,
  mockStreamsDocGet,
  mockStreamsDocDelete,
  mockStreamsDoc,
  mockStreamsCollection,
  mockCreateYouTubeBroadcast,
  mockGetYouTubeBroadcastStatus,
  mockDeleteYouTubeBroadcast,
  MockHttpsError,
  capturedHandlers,
  capturedScheduleHandlerRef,
} = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockDoc = vi.fn(() => ({ get: mockGet }));
  const mockCollection = vi.fn((_name?: string) => ({ doc: mockDoc }));
  const mockAdd = vi.fn();
  const mockWhereGet = vi.fn();
  const mockWhere = vi.fn(() => ({ where: mockWhere, get: mockWhereGet }));
  const mockStreamsDocGet = vi.fn();
  const mockStreamsDocDelete = vi.fn();
  const mockStreamsDoc = vi.fn(() => ({
    get: mockStreamsDocGet,
  }));
  const mockStreamsCollection = vi.fn((_name?: string) => ({
    add: mockAdd,
    where: mockWhere,
    doc: mockStreamsDoc,
  }));
  const mockCreateYouTubeBroadcast = vi.fn();
  const mockGetYouTubeBroadcastStatus = vi.fn();
  const mockDeleteYouTubeBroadcast = vi.fn();

  class MockHttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  }

  const capturedHandlers: Array<(request: unknown) => Promise<unknown>> = [];
  const capturedScheduleHandlerRef: { current: (() => Promise<void>) | null } = {
    current: null,
  };

  return {
    mockGet,
    mockDoc,
    mockCollection,
    mockAdd,
    mockWhere,
    mockWhereGet,
    mockStreamsDocGet,
    mockStreamsDocDelete,
    mockStreamsDoc,
    mockStreamsCollection,
    mockCreateYouTubeBroadcast,
    mockGetYouTubeBroadcastStatus,
    mockDeleteYouTubeBroadcast,
    MockHttpsError,
    capturedHandlers,
    capturedScheduleHandlerRef,
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
      toMillis: () => d.getTime(),
      _seconds: Math.floor(d.getTime() / 1000),
    })),
    now: vi.fn(() => ({
      toMillis: () => Date.now(),
    })),
    fromMillis: vi.fn((ms: number) => ({
      toMillis: () => ms,
      _seconds: Math.floor(ms / 1000),
    })),
  },
}));

vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((_opts: unknown, handler: (request: unknown) => Promise<unknown>) => {
    capturedHandlers.push(handler);
    return 'mocked-cloud-function';
  }),
  HttpsError: MockHttpsError,
}));

vi.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: vi.fn((_opts: unknown, handler: () => Promise<void>) => {
    capturedScheduleHandlerRef.current = handler;
    return 'mocked-scheduled-function';
  }),
}));

vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn((name: string) => ({
    value: () => `mock-${name}`,
  })),
}));

vi.mock('./youtube', () => ({
  createYouTubeBroadcast: mockCreateYouTubeBroadcast,
  getYouTubeBroadcastStatus: mockGetYouTubeBroadcastStatus,
  deleteYouTubeBroadcast: mockDeleteYouTubeBroadcast,
}));

// --- Import module under test (triggers onCall capture) ---
import './index';

// --- Helpers ---

function createHandler() {
  if (!capturedHandlers[0]) {
    throw new Error('createBroadcast handler was not captured — onCall mock not invoked');
  }
  return capturedHandlers[0];
}

function deleteHandler() {
  if (!capturedHandlers[1]) {
    throw new Error('deleteBroadcast handler was not captured — onCall mock not invoked');
  }
  return capturedHandlers[1];
}

function scheduleHandler() {
  if (!capturedScheduleHandlerRef.current) {
    throw new Error('Schedule handler was not captured — onSchedule mock not invoked');
  }
  return capturedScheduleHandlerRef.current;
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
    await expect(createHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
  });

  it('throws unauthenticated when email is missing', async () => {
    const request = makeRequest({
      auth: { uid: 'user123', token: {} },
    });
    await expect(createHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
  });

  it('throws permission-denied when user is not on allowlist', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const request = makeRequest();
    await expect(createHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' }),
    );
  });

  it('throws invalid-argument for missing title', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeRequest({
      data: { title: '', scheduledStartTime: '2026-04-01T10:00:00Z' },
    });
    await expect(createHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws invalid-argument for missing scheduledStartTime', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeRequest({
      data: { title: 'Sunday Service', scheduledStartTime: '' },
    });
    await expect(createHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws invalid-argument for invalid date format', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeRequest({
      data: { title: 'Sunday Service', scheduledStartTime: 'not-a-date' },
    });
    await expect(createHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws internal when YouTube API fails', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockCreateYouTubeBroadcast.mockRejectedValueOnce(new Error('YouTube API down'));

    const request = makeRequest();
    await expect(createHandler()(request)).rejects.toThrow(
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
    const result = await createHandler()(request);

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

describe('manageStreamStatuses', () => {
  function makeDoc(id: string, data: Record<string, unknown>) {
    const mockUpdate = vi.fn();
    const mockDeleteDoc = vi.fn();
    return {
      id,
      data: () => data,
      ref: { update: mockUpdate, delete: mockDeleteDoc },
      _mockUpdate: mockUpdate,
      _mockDelete: mockDeleteDoc,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('promotes SCHEDULED to BROADCAST when YouTube says live', async () => {
    const doc = makeDoc('stream-1', { youtube_id: 'yt-1' });
    // The handler calls .where().where().get() three times (3 passes)
    mockWhereGet
      .mockResolvedValueOnce({ docs: [doc] })   // Pass 1: scheduled <= now
      .mockResolvedValueOnce({ docs: [] })        // Pass 2: stale scheduled
      .mockResolvedValueOnce({ docs: [] });       // Pass 3: old broadcast

    mockGetYouTubeBroadcastStatus.mockResolvedValueOnce('live');

    await scheduleHandler()();

    expect(mockGetYouTubeBroadcastStatus).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'mock-YOUTUBE_CLIENT_ID' }),
      'yt-1',
    );
    expect(doc._mockUpdate).toHaveBeenCalledWith({ status: 'BROADCAST' });
  });

  it('promotes SCHEDULED to BROADCAST when YouTube says complete', async () => {
    const doc = makeDoc('stream-2', { youtube_id: 'yt-2' });
    mockWhereGet
      .mockResolvedValueOnce({ docs: [doc] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    mockGetYouTubeBroadcastStatus.mockResolvedValueOnce('complete');

    await scheduleHandler()();

    expect(doc._mockUpdate).toHaveBeenCalledWith({ status: 'BROADCAST' });
  });

  it('does not promote SCHEDULED when YouTube says created', async () => {
    const doc = makeDoc('stream-3', { youtube_id: 'yt-3' });
    mockWhereGet
      .mockResolvedValueOnce({ docs: [doc] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    mockGetYouTubeBroadcastStatus.mockResolvedValueOnce('created');

    await scheduleHandler()();

    expect(doc._mockUpdate).not.toHaveBeenCalled();
  });

  it('deletes stale SCHEDULED streams and their YouTube broadcasts', async () => {
    const doc = makeDoc('stream-4', { youtube_id: 'yt-4' });
    mockWhereGet
      .mockResolvedValueOnce({ docs: [] })        // Pass 1
      .mockResolvedValueOnce({ docs: [doc] })     // Pass 2: stale
      .mockResolvedValueOnce({ docs: [] });       // Pass 3

    mockDeleteYouTubeBroadcast.mockResolvedValueOnce(undefined);

    await scheduleHandler()();

    expect(mockDeleteYouTubeBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'mock-YOUTUBE_CLIENT_ID' }),
      'yt-4',
    );
    expect(doc._mockDelete).toHaveBeenCalled();
  });

  it('deletes Firestore doc even if YouTube delete fails with 404', async () => {
    const doc = makeDoc('stream-5', { youtube_id: 'yt-5' });
    mockWhereGet
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [doc] })
      .mockResolvedValueOnce({ docs: [] });

    mockDeleteYouTubeBroadcast.mockRejectedValueOnce({ code: 404 });

    await scheduleHandler()();

    expect(doc._mockDelete).toHaveBeenCalled();
  });

  it('archives old BROADCAST streams', async () => {
    const doc = makeDoc('stream-6', {});
    mockWhereGet
      .mockResolvedValueOnce({ docs: [] })        // Pass 1
      .mockResolvedValueOnce({ docs: [] })        // Pass 2
      .mockResolvedValueOnce({ docs: [doc] });    // Pass 3: old broadcast

    await scheduleHandler()();

    expect(doc._mockUpdate).toHaveBeenCalledWith({ status: 'ARCHIVED' });
  });

  it('skips streams without youtube_id in Pass 1', async () => {
    const doc = makeDoc('stream-7', {});
    mockWhereGet
      .mockResolvedValueOnce({ docs: [doc] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] });

    await scheduleHandler()();

    expect(mockGetYouTubeBroadcastStatus).not.toHaveBeenCalled();
    expect(doc._mockUpdate).not.toHaveBeenCalled();
  });
});

describe('deleteBroadcast onCall handler', () => {
  function makeDeleteRequest(overrides: Record<string, unknown> = {}) {
    return {
      auth: {
        uid: 'user123',
        token: { email: 'test@example.com' },
      },
      data: {
        firestoreId: 'doc-123',
      },
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws unauthenticated when request.auth is null', async () => {
    const request = makeDeleteRequest({ auth: null });
    await expect(deleteHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
  });

  it('throws permission-denied when user is not on allowlist', async () => {
    mockGet.mockResolvedValueOnce({ exists: false });

    const request = makeDeleteRequest();
    await expect(deleteHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'permission-denied' }),
    );
  });

  it('throws invalid-argument for missing firestoreId', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });

    const request = makeDeleteRequest({ data: {} });
    await expect(deleteHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  it('throws not-found when stream document does not exist', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockStreamsDocGet.mockResolvedValueOnce({ exists: false });

    const request = makeDeleteRequest();
    await expect(deleteHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'not-found' }),
    );
  });

  it('throws failed-precondition for non-SCHEDULED streams', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockStreamsDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'BROADCAST', youtube_id: 'yt-1' }),
      ref: { delete: mockStreamsDocDelete },
    });

    const request = makeDeleteRequest();
    await expect(deleteHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'failed-precondition' }),
    );
  });

  it('deletes YouTube broadcast and Firestore doc on success', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockStreamsDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'SCHEDULED', youtube_id: 'yt-123' }),
      ref: { delete: mockStreamsDocDelete },
    });
    mockDeleteYouTubeBroadcast.mockResolvedValueOnce(undefined);
    mockStreamsDocDelete.mockResolvedValueOnce(undefined);

    const request = makeDeleteRequest();
    const result = await deleteHandler()(request);

    expect(result).toEqual({ deleted: true });
    expect(mockDeleteYouTubeBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'mock-YOUTUBE_CLIENT_ID' }),
      'yt-123',
    );
    expect(mockStreamsDocDelete).toHaveBeenCalled();
  });

  it('swallows 404 from YouTube and still deletes Firestore doc', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockStreamsDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'SCHEDULED', youtube_id: 'yt-gone' }),
      ref: { delete: mockStreamsDocDelete },
    });
    mockDeleteYouTubeBroadcast.mockRejectedValueOnce({ code: 404 });
    mockStreamsDocDelete.mockResolvedValueOnce(undefined);

    const request = makeDeleteRequest();
    const result = await deleteHandler()(request);

    expect(result).toEqual({ deleted: true });
    expect(mockStreamsDocDelete).toHaveBeenCalled();
  });

  it('throws internal when YouTube delete fails with non-404 error', async () => {
    mockGet.mockResolvedValueOnce({ exists: true });
    mockStreamsDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ status: 'SCHEDULED', youtube_id: 'yt-err' }),
      ref: { delete: mockStreamsDocDelete },
    });
    mockDeleteYouTubeBroadcast.mockRejectedValueOnce({ code: 500 });

    const request = makeDeleteRequest();
    await expect(deleteHandler()(request)).rejects.toThrow(
      expect.objectContaining({ code: 'internal' }),
    );
    expect(mockStreamsDocDelete).not.toHaveBeenCalled();
  });
});
