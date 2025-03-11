import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals", 
    "next/typescript", 
    "prettier"
  ),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // React rules
      "react-hooks/exhaustive-deps": "error",
      "react/prop-types": "off", // Not needed with TypeScript
      "react/react-in-jsx-scope": "off", // Next.js doesn't require React import

      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-interface": "warn",

      // General
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "no-duplicate-imports": "error",
      "no-unused-expressions": "warn",
    },
  },
  {
    // Ignore build artifacts and node modules
    ignores: ["node_modules/", ".next/", "out/", "build/", "public/"]
  }
];

export default eslintConfig;
