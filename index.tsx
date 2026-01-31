
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handling for browser environments
window.addEventListener('error', (event) => {
  if (event.message.includes('process is not defined')) {
    console.warn('Caught process reference error - applying shim...');
  }
});

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  mountApp();
} else {
  document.addEventListener('DOMContentLoaded', mountApp);
}
