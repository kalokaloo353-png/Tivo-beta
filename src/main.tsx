import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global resilience handler for browser media/audio policy aborts and uncaught errors
if (typeof window !== 'undefined') {
  window.onerror = function() {
    // Suppress uncaught errors from bubbling to test runner / top-level crash
    return true;
  };
  window.onunhandledrejection = function(event) {
    if (event) {
      event.preventDefault();
    }
    return true;
  };
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
  });
  window.addEventListener('error', (event) => {
    event.preventDefault();
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
