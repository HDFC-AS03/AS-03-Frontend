require("@testing-library/jest-dom");

// Must be here — before JSDOM locks window.location
delete globalThis.location;
globalThis.location = {
  href: "",
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};
