// app/mocks/prisma.ts

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// On crée un mock profond de PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Réinitialise le mock avant chaque test (à appeler dans beforeEach)
export function resetPrismaMock() {
  mockReset(prismaMock);
}