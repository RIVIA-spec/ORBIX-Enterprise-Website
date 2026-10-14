module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  cacheDirectory: '<rootDir>/.jest-cache',
  testRegex: '.*(\\.|-)spec\\.ts$',
  testPathIgnorePatterns: process.env.RUN_INTEGRATION === 'true' ? ['/node_modules/'] : ['/node_modules/', '.*integration-spec\\.ts$'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  testEnvironment: 'node'
};
