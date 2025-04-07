/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // globalSetup: "<rootDir>/config/globalSetup.ts",
  // globalTeardown: "<rootDir>/config/globalTeardown.ts",
  // setupFilesAfterEnv: ["<rootDir>/config/setupFile.ts"],
  verbose: true,
  testTimeout: 30_000,
};
