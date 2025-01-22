// Mock CSS/SCSS/SASS imports for Jest
module.exports = {
  // Return an empty object for CSS Module imports
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: function getter(target, key) {
        // Return the key as the class name
        if (key === '__esModule') {
          return false;
        }
        return key;
      },
    }
  ),
  // Mock specific CSS-in-JS features
  createGlobalStyle: () => () => null,
  keyframes: () => 'animation-name',
  css: (...args) => JSON.stringify(args),
  // Mock CSS Module composition
  compose: (...classNames) => classNames.join(' '),
  // Mock CSS custom properties
  vars: new Proxy(
    {},
    {
      get: function getter(target, key) {
        return `var(--${key})`;
      },
    }
  ),
};