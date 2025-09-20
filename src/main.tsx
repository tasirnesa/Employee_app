import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { withQueryClient } from './lib/react-query';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {withQueryClient(<App />)}
  </React.StrictMode>
);