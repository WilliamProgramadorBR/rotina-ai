import { api } from "./api";
import { User } from "@/types/api";

export type AuthResponse = {
  user: User;
  token: string;
};

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  return data;
}

export async function registerRequest(name: string, email: string, password: string, acceptedPrivacy = false) {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
    acceptedPrivacy,
  });

  return data;
}

export async function meRequest() {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data.user;
}
