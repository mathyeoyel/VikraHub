// src/auth.js

export function saveToken(token) {
  localStorage.setItem('access', token.access);
  localStorage.setItem('refresh', token.refresh);
}

export function getAccessToken() {
  return localStorage.getItem('access');
}

export function getRefreshToken() {
  return localStorage.getItem('refresh');
}

export function removeTokens() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}

export function isLoggedIn() {
  return !!getAccessToken();
}