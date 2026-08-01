import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Le module de facturation doit rester autonome et déplaçable tel quel dans
    // un autre projet Next.js. Il ne dépend que de React et de lui-même.
    // Voir docs/facturation/transfert-omra.md.
    files: ['modules/facturation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/components/*', '@/lib/*', '../../../*'],
              message:
                'Le module de facturation doit rester autonome : aucun import hors de modules/facturation/.',
            },
          ],
        },
      ],
    },
  },
  {
    // Le domaine est pur : ni React, ni Next.js, ni accès à une base de données.
    files: ['modules/facturation/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*', '@supabase/*', '../data/*'],
              message:
                'Le domaine doit rester pur : aucune dépendance à React, Next.js ou à la persistance.',
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
