import { nestConfig } from '@repo/eslint-config/nest';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...nestConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
