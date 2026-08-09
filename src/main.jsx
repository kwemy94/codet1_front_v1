import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './components/ui/ui.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
