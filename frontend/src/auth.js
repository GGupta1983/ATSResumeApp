// Simple auth utility for storing JWT in localStorage
export function setToken(token) {
  localStorage.setItem('jwt', token);
}

export function getToken() {
  return localStorage.getItem('jwt');
}

export function clearToken() {
  localStorage.removeItem('jwt');
}

export function isLoggedIn() {
  return !!getToken();
}
