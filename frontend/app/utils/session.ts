// O token fica no localStorage para a sessão sobreviver a um F5: é o que "simples" pede aqui.
// Quem fala com a API é o ServiceHttp; quem decide se há sessão é a guarda do _app.
const TOKEN_KEY = "oficina_token";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

/**
 * Sai recarregando a página, e não navegando: o 401 pode chegar de dentro de um loader adiado, onde
 * um redirect lançado viraria erro de tela. Recarregar zera tudo e cai na guarda, que leva ao login.
 */
export function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = "/login";
}
