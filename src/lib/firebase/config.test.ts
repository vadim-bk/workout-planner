import * as firestore from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCollectionDocs, addDocument, updateDocument } from './config';

vi.mock('firebase/firestore', () => ({
  query: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('./config', async () => {
  const actual = await vi.importActual('./config');
  return {
    ...actual,
    db: {},
  };
});

describe('getCollectionDocs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates query and fetches documents', async () => {
    const mockWhere = vi.fn();
    const mockOrderBy = vi.fn();
    const mockQuery = {};
    const mockSnapshot = { docs: [] };
    const mockCollectionRef = {};

    vi.mocked(firestore.collection).mockReturnValue(mockCollectionRef as never);
    vi.mocked(firestore.query).mockReturnValue(mockQuery as never);
    vi.mocked(firestore.getDocs).mockResolvedValue(mockSnapshot as never);

    const result = await getCollectionDocs('test-collection', mockWhere as never, mockOrderBy as never);

    expect(firestore.collection).toHaveBeenCalled();
    expect(firestore.query).toHaveBeenCalled();
    expect(firestore.getDocs).toHaveBeenCalledWith(mockQuery);
    expect(result).toBe(mockSnapshot);
  });
});

describe('addDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds document to collection', async () => {
    const mockCollectionRef = {};
    const mockDocRef = { id: 'doc-123' };
    const testData = { name: 'Test', value: 123 };

    vi.mocked(firestore.collection).mockReturnValue(mockCollectionRef as never);
    vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as never);

    const result = await addDocument('test-collection', testData);

    expect(firestore.collection).toHaveBeenCalled();
    expect(firestore.addDoc).toHaveBeenCalledWith(mockCollectionRef, testData);
    expect(result).toBe(mockDocRef);
  });
});

describe('updateDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates document in collection', async () => {
    const mockDocRef = {};
    const testData = { name: 'Updated', value: 456 };
    const testId = 'doc-123';

    vi.mocked(firestore.doc).mockReturnValue(mockDocRef as never);
    vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

    await updateDocument('test-collection', testId, testData);

    expect(firestore.doc).toHaveBeenCalled();
    expect(firestore.updateDoc).toHaveBeenCalledWith(mockDocRef, testData);
  });
});
