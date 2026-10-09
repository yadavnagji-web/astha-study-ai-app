import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge any stale caches and register fresh Service Worker
if (typeof window !== 'undefined') {
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        if (key !== 'astha-study-v2') {
          caches.delete(key);
        }
      }
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update();
      }).catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
