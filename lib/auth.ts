// lib/auth.ts
// Replace with actual Kinde SDK usage; these are placeholders.
export async function getSessionUser() {
  // return { id: 'user_123', email: 'x@y.z', name: 'Jane' } or null
  return null;
}
export async function isAuthenticated() {
  return !!(await getSessionUser());
}
