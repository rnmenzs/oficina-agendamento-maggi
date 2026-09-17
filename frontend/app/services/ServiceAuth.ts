import type { LoginRequest, LoginResponse } from "~/types/TypeAuth";
import { request } from "./ServiceHttp";

export function login(credentials: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", { method: "POST", body: credentials });
}
