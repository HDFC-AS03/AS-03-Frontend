/**
 * Auth API (httpOnly Cookie Mode)
 * 
 * Enterprise pattern: Frontend NEVER handles tokens
 * - Access token: httpOnly cookie (set by backend)
 * - Refresh token: httpOnly cookie (set by backend)
 * - CSRF token: readable cookie (for POST/PUT/DELETE protection)
 * 
 * The browser automatically sends httpOnly cookies with credentials: 'include'
 */

// Gateway URL - all requests go through API gateway
const GATEWAY_URL = "http://localhost";

/**
 * Get CSRF token from cookie (set by backend)
 */
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Make authenticated fetch request through gateway
 * Browser automatically sends httpOnly cookies
 */
export async function authFetch(endpoint, options = {}) {
  const headers = { ...options.headers };
  
  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  const response = await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send httpOnly cookies automatically
  });
  
  return response;
}

export function login() {
  window.location.href = `${GATEWAY_URL}/login`;
}

export function logout() {
  window.location.href = `${GATEWAY_URL}/logout`;
}

/**
 * Get current user from backend
 * Backend reads access_token from httpOnly cookie
 */
export async function getCurrentUser() {
  const response = await authFetch('/me');
  
  if (!response.ok) {
    throw new Error("Not authenticated");
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * Refresh access token using httpOnly refresh_token cookie
 */
export async function refreshAccessToken() {
  try {
    const response = await authFetch('/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  try {
    const response = await authFetch('/me');
    return response.ok;
  } catch {
    return false;
  }
}
