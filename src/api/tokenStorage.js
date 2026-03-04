/**
 * Token Storage Utility
 * 
 * Development Mode:
 * - Access token: memory only
 * - Refresh token: sessionStorage (acceptable XSS risk for dev)
 * 
 * Production Mode:
 * - Access token: memory only  
 * - Refresh token: httpOnly cookie (handled by backend)
 * 
 * To switch to production mode, deploy with HTTPS and set ENV=production
 */

// Memory-only storage for access token
let accessToken = null;

// Session storage key for refresh token (dev only)
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store access token in memory
 */
export function setAccessToken(token) {
  accessToken = token;
}

/**
 * Get access token from memory
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Store refresh token (sessionStorage in dev)
 */
export function setRefreshToken(token) {
  if (token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/**
 * Get refresh token from sessionStorage
 */
export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear all tokens
 */
export function clearTokens() {
  accessToken = null;
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user has tokens stored
 */
export function hasTokens() {
  return !!accessToken || !!getRefreshToken();
}

/**
 * Parse tokens from URL hash fragment (used after OAuth callback)
 * Format: #access_token=xxx&refresh_token=yyy
 */
export function parseTokensFromHash() {
  const hash = window.location.hash.substring(1); // Remove #
  if (!hash) return null;
  
  const params = new URLSearchParams(hash);
  const access = params.get('access_token');
  const refresh = params.get('refresh_token');
  
  if (access) {
    setAccessToken(access);
    if (refresh) {
      setRefreshToken(refresh);
    }
    // Clear hash from URL (security)
    window.history.replaceState(null, '', window.location.pathname);
    return { accessToken: access, refreshToken: refresh };
  }
  
  return null;
}

/**
 * Decode JWT payload (without verification)
 * Used to extract user info and check expiry
 */
export function decodeToken(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Base64URL decode
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
}

/**
 * Check if access token is expired or about to expire
 * @param {number} bufferSeconds - Consider expired if within this many seconds
 */
export function isTokenExpired(bufferSeconds = 30) {
  const token = getAccessToken();
  if (!token) return true;
  
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const expiryTime = payload.exp * 1000; // Convert to ms
  const now = Date.now();
  const buffer = bufferSeconds * 1000;
  
  return now >= (expiryTime - buffer);
}

/**
 * Get user info from stored access token
 */
export function getUserFromToken() {
  const token = getAccessToken();
  if (!token) return null;
  
  const payload = decodeToken(token);
  if (!payload) return null;
  
  return {
    sub: payload.sub,
    email: payload.email,
    preferred_username: payload.preferred_username,
    name: payload.name,
    roles: payload.realm_access?.roles || [],
    exp: payload.exp,
  };
}
