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

export async function updateProfileRequest(payload: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}) {
  const { data } = await api.patch<{ user: User }>("/auth/me", payload);
  return data.user;
}

export async function uploadAvatarRequest(fileUri: string): Promise<string> {
  const filename = fileUri.split("/").pop() ?? "avatar.jpg";
  const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const formData = new FormData();
  formData.append("avatar", { uri: fileUri, name: `avatar.${ext}`, type: mimeType } as any);

  const { data } = await api.post<{ avatarUrl: string }>("/auth/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000
  });

  return data.avatarUrl;
}
