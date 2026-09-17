import type { LoginResponse } from "~/types/TypeAuth";

const TOKEN_KEY = "oficina_token";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

/** Limpa o token e manda para a tela de login. */
export function logout(): void {
    clearToken();
    window.location.href = "/login";
}
