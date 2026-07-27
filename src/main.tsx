import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-bokka-surface)',
            color: 'var(--color-bokka-ink)',
            border: '1px solid var(--color-bokka-border)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 12px -2px rgb(11 18 32 / 0.08), 0 2px 4px -2px rgb(11 18 32 / 0.04)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-bokka-success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-bokka-danger)',
              secondary: 'white',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
