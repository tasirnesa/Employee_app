import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { withQueryClient } from './lib/react-query';
import './index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

// Note: MsalProvider is not used at the root level because we use loginPopup() directly.
// This avoids MSAL initialization timing issues with placeholder client IDs.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock_google_client_id'}>
      {withQueryClient(<App />)}
    </GoogleOAuthProvider>
  </React.StrictMode>
);
