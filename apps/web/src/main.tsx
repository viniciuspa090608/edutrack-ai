import 'animate.css';
import '@study-platform/ui/globals.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App.js';
import './styles/main.css';
import './styles/landing.css';
import './styles/auth.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
