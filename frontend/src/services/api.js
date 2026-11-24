const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "No se pudo completar la solicitud.");
  }

  return data;
}

export const authApi = {
  login: (identifier, password) =>
    apiRequest("/api/auth/login", { method: "POST", body: { identifier, password } }),
  register: (userData) =>
    apiRequest("/api/auth/register", { method: "POST", body: userData }),
  me: (token) => apiRequest("/api/auth/me", { token }),
};

export const profileApi = {
  get: (token) => apiRequest("/api/profile", { token }),
  update: (token, profile) =>
    apiRequest("/api/profile", { method: "PUT", token, body: profile }),
  uploadMedia: async (token, file) => {
    const response = await fetch(`${API_URL}/api/profile/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      },
      body: file,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "No se pudo subir el archivo.");
    return data;
  },
  deleteMedia: (token, mediaId) =>
    apiRequest(`/api/profile/media/${encodeURIComponent(mediaId)}`, { method: "DELETE", token }),
  uploadPhoto: async (token, file) => {
    const response = await fetch(`${API_URL}/api/profile/photo`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": file.type,
      },
      body: file,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || "No se pudo subir la foto.");
    }
    return data;
  },
};

export const discoveryApi = {
  list: (token, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value != null) params.set(key, String(value));
    });
    return apiRequest(`/api/discover?${params.toString()}`, { token });
  },
};

export const likesApi = {
  listSent: (token) => apiRequest("/api/likes", { token }),
  like: (token, userId) =>
    apiRequest(`/api/likes/${encodeURIComponent(userId)}`, { method: "POST", token }),
  unlike: (token, userId) =>
    apiRequest(`/api/likes/${encodeURIComponent(userId)}`, { method: "DELETE", token }),
};

export const matchesApi = {
  list: (token) => apiRequest("/api/matches", { token }),
};

export const conversationsApi = {
  list: (token) => apiRequest("/api/conversations", { token }),
  messages: (token, conversationId) =>
    apiRequest(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, { token }),
  sendMessage: (token, conversationId, content) =>
    apiRequest(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      token,
      body: { content },
    }),
};
