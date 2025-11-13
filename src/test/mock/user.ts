import type { User } from '@/types';

export const createUser = (overrides?: Partial<User>): User => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  ...overrides,
});
