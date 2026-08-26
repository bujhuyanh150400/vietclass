import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Modules are encapsulated: consumers may only reach a module through its
  // client-safe root entrypoint or its server-only entrypoint.
  {
    name: "vietclass/module-encapsulation",
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/modules/[^/]+/(?!server$).+",
              message:
                "Import a module only through '@/modules/<module>' or '@/modules/<module>/server'.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
