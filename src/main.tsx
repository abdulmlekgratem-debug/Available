import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import './redesign.css';
import './i18n';
import ToastNotifications from './components/ToastNotifications';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <ToastNotifications />
      <Toaster />
    </ErrorBoundary>
  </StrictMode>
);
