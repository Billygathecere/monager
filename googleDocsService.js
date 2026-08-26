// Google Docs & Drive Integration Service for MONAGER V4
// Supports authenticating with Google Workspace and exporting documents directly to Google Docs / Google Drive.

let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;

const DISCOVERY_DOC = 'https://docs.googleapis.com/$discovery/rest?version=v1';
const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file';

export function isGoogleDocsConfigured() {
  return typeof google !== 'undefined' && typeof gapi !== 'undefined';
}

export function initGoogleAuth(clientId, onReady) {
  if (typeof google === 'undefined' || typeof gapi === 'undefined') {
    console.warn('Google Identity Services or GAPI script not yet loaded.');
    return;
  }

  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          if (typeof onReady === 'function') onReady(accessToken);
        }
      },
    });

    gapi.load('client', async () => {
      await gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC, 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      });
      gapiInited = true;
    });

    gisInited = true;
  } catch (err) {
    console.error('Failed to initialize Google Docs client:', err);
  }
}

export function requestGoogleAccessToken(onSuccess, onError) {
  if (!tokenClient) {
    if (typeof onError === 'function') onError(new Error('Google OAuth client not initialized'));
    return;
  }

  tokenClient.callback = (resp) => {
    if (resp.error) {
      if (typeof onError === 'function') onError(resp);
      return;
    }
    accessToken = resp.access_token;
    if (typeof onSuccess === 'function') onSuccess(accessToken);
  };

  tokenClient.requestAccessToken({ prompt: 'consent' });
}

export async function createGoogleDocWithPlan(planMarkdown, token) {
  const effectiveToken = token || accessToken;
  if (!effectiveToken) {
    throw new Error('User not authenticated with Google Workspace.');
  }

  // 1. Create a blank Google Document
  const createResp = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'MONAGER V4.0.0 — Architecture Audit & Implementation Plan',
    }),
  });

  if (!createResp.ok) {
    const errData = await createResp.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Failed to create Google Doc');
  }

  const docData = await createResp.json();
  const documentId = docData.documentId;

  // 2. Insert text content into the document
  // Clean markdown syntax into formatted clean text blocks for Google Docs
  const textContent = planMarkdown;

  const insertResp = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: textContent + '\n',
          }
        }
      ]
    }),
  });

  if (!insertResp.ok) {
    console.warn('Batch update partially failed, but document was created.');
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}
