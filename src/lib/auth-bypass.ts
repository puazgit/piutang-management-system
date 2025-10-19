/* 
 * AUTH BYPASS DISABLED
 * Authentication is now active
 */

// Global bypass flag - SET TO FALSE TO ENABLE AUTH
export const AUTH_BYPASS = false;

// Helper function to bypass auth
export function bypassAuth() {
  return AUTH_BYPASS;
}