
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Глобальное логирование для отладки
console.log('[Index] Application starting...');
console.log('[Index] Current URL:', window.location.href);
console.log('[Index] User agent:', navigator.userAgent);

// Логирование изменений URL
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function(...args) {
  console.log('[History] pushState called with:', args);
  return originalPushState.apply(this, args);
};

window.history.replaceState = function(...args) {
  console.log('[History] replaceState called with:', args);
  return originalReplaceState.apply(this, args);
};

// Логирование событий popstate
window.addEventListener('popstate', (event) => {
  console.log('[History] popstate event:', event);
  console.log('[History] Current URL after popstate:', window.location.href);
});

// Логирование ошибок
window.addEventListener('error', (event) => {
  console.error('[Global] JavaScript error:', event.error);
  console.error('[Global] Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Логирование unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled promise rejection:', event.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root')!);
console.log('[Index] Rendering React app...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[Index] React app rendered');
