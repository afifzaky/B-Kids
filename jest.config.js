/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Alias resolution (mirrors tsconfig paths if any)
  },
  collectCoverageFrom: [
    'src/modules/admin/admin.controller.ts',
    'src/modules/admin/admin.service.ts',
    'src/modules/auth/auth.service.ts',
    'src/modules/vouchers/vouchers.validator.ts',
    'src/modules/chores/chores.service.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
};
