import type { JestConfigWithTsJest } from 'ts-jest';

//see https://www.gatsbyjs.org/docs/unit-testing/
const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // ...pathsToModuleNameMapper(compilerOptions.paths, {
    //     prefix: '<rootDir>/'
    // }),
    '.+\\.(css|less|scss|sass|styl)$':
      '<rootDir>/node_modules/jest-css-modules',
    '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/file-mock.ts'
  },
  coverageDirectory: '<rootDir>/coverage',
  collectCoverage: false,
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx,js,jsx}'],
  testPathIgnorePatterns: [
    'tests/setup',
    '\\.cache',
    '<rootDir>.*/public',
    'tests/e2e'
  ],
  moduleFileExtensions: ['ts', 'js', 'tsx', 'jsx'],
  globals: {
    __PATH_PREFIX__: ''
  },
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  setupFiles: ['<rootDir>/tests/setup/loadershim.ts']
};

export default jestConfig;
