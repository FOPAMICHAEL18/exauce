import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", ".vinext/**", "node_modules/**"],
  },
]