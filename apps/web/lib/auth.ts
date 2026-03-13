"use client";

const TOKEN_KEY = "fieldlens-web-token";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return "demo-supervisor";
  }
  return window.localStorage.getItem(TOKEN_KEY) ?? "demo-supervisor";
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

