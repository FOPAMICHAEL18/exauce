import { vi } from 'vitest';

export interface MockRequestCookie {
  name: string;
  value: string;
}

export interface MockCookieStore {
  get: (name: string) => MockRequestCookie | undefined;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  delete: (name: string) => void;
  has: (name: string) => boolean;
  getAll: () => MockRequestCookie[];
}

export const cookies = vi.fn<() => Promise<MockCookieStore>>();