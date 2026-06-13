import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Executa cleanup após cada caso de teste para limpar a árvore DOM simulada
afterEach(() => {
  cleanup();
});
