import { PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'mock_msal_client_id_placeholder';
const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common';

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: '/',
    postLogoutRedirectUri: '/'
  },
  cache: {
    cacheLocation: 'sessionStorage' as const,
    storeAuthStateInCookie: false,
  }
};

// Export a lazy getter instead of creating the instance at module load time.
// This prevents MSAL from throwing on import when no real clientId is set.
let _msalInstance: PublicClientApplication | null = null;

export const getMsalInstance = (): PublicClientApplication => {
  if (!_msalInstance) {
    _msalInstance = new PublicClientApplication(msalConfig);
  }
  return _msalInstance;
};

// Legacy named export kept for backward compat — same lazy instance
export const msalInstance = {
  loginPopup: async (request: any) => {
    const instance = getMsalInstance();
    await instance.initialize();
    return instance.loginPopup(request);
  }
};
