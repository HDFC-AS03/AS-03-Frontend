import { 
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  getUserFromToken,
  isTokenExpired,
  parseTokensFromHash 
} from './tokenStorage.js';

// Gateway URL for all API requests
const GATEWAY_URL = "http://localhost";

/**
 * Make authenticated fetch request through gateway
 * Automatically adds Bearer token and handles token refresh
 */
export async function authFetch(endpoint, options = {}) {
  // Check if token needs refresh
  if (isTokenExpired(30)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearTokens();
      throw new Error("Session expired");
    }
  }
  
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Not authenticated");
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };
  
  const response = await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // If 401, try refresh once
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      return fetch(`${GATEWAY_URL}${endpoint}`, { ...options, headers });
    }
    clearTokens();
    throw new Error("Session expired");
  }
  
  return response;
}

/**
 * Refresh access token using refresh token
 * Sends refresh_token in request body (development mode)
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${GATEWAY_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    if (data.access_token) {
      setAccessToken(data.access_token);
      // Update refresh token if returned (token rotation)
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return false;
  }
}

/**
 * Redirect to login page
 */
export function login() {
  window.location.href = `${GATEWAY_URL}/login`;
}

/**
 * Logout - clear tokens and redirect (through gateway)
 */
export function logout() {
  clearTokens();
  window.location.href = `${GATEWAY_URL}/logout`;
}

/**
 * Get current user info
 * 1. Check for tokens in URL hash (after OAuth callback)
 * 2. If no token in memory, try refresh using stored refresh token
 * 3. Validate token through gateway /me endpoint
 */
export async function getCurrentUser() {
  // Check for tokens in URL hash (after OAuth callback)
  parseTokensFromHash();
  
  // If no token in memory, try refresh using stored refresh token
  if (!getAccessToken()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error("Not authenticated");
    }
  }
  
  // Get user from stored token
  const user = getUserFromToken();
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  // Validate token through gateway (RS256 signature verification)
  try {
    const response = await authFetch('/me');
    if (response.ok) {
      // Token validated by gateway, return user info
      return user;
    }
  } catch (e) {
    // Gateway validation failed - try local token only
    console.warn('Gateway validation failed, using local token:', e.message);
  }
  
  // Fallback: if gateway unreachable but token exists, still show user
  return user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken() && !isTokenExpired(0);
}

/**
 * Initialize auth - call on app mount to restore session
 * Attempts refresh using stored refresh token
 */
export async function initAuth() {
  // Check URL hash first (OAuth callback)
  parseTokensFromHash();
  
  // If no token in memory but have refresh token, try refresh
  if (!getAccessToken() && getRefreshToken()) {
    await refreshAccessToken();
  }
  
  return isAuthenticated();
}

// Export token utilities for dashboard
export { getAccessToken, getRefreshToken, clearTokens, isTokenExpired, parseTokensFromHash };
