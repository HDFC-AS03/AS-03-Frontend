export default {
  testMatch: ["**/__tests__/**/*.test.jsx"],
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.cjs",
  },
  testPathIgnorePatterns: ["/node_modules/"],
};