import globals from "globals";
export default [
  { ignores: ["node_modules/**", ".openai/**"] },
  {
    files: ["dist/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.browser, Cesium: "readonly", globalThis: "readonly" },
    },
    rules: {
      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "no-dupe-keys": "error",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["tests/**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
    rules: { "no-undef": "error", "no-unreachable": "error" },
  },
];
