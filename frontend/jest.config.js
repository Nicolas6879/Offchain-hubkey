module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/(?!(\@hashgraph|uuid)/)'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
