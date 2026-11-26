export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

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
  get: (token, userId) => apiRequest(`/api/discover/${encodeURIComponent(userId)}`, { token }),
  list: (token, limit = 20, filters = {}, offset = 0) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
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

export const favoritesApi = {
  list: (token) => apiRequest("/api/favorites", { token }),
  add: (token, talentId) =>
    apiRequest(`/api/favorites/${encodeURIComponent(talentId)}`, { method: "POST", token }),
  remove: (token, talentId) =>
    apiRequest(`/api/favorites/${encodeURIComponent(talentId)}`, { method: "DELETE", token }),
};

export const matchesApi = {
  list: (token) => apiRequest("/api/matches", { token }),
};

export const invitationsApi = {
  list: (token) => apiRequest("/api/invitations", { token }),
  create: (token, invitation) => apiRequest("/api/invitations", { method: "POST", token, body: invitation }),
  respond: (token, invitationId, status) => apiRequest(`/api/invitations/${encodeURIComponent(invitationId)}`, { method: "PATCH", token, body: { status } }),
};

export const conversationsApi = {
  list: (token) => apiRequest("/api/conversations", { token }),
  messages: (token, conversationId, options = {}) => {
    const params = new URLSearchParams();
    if (options.before) params.set("before", options.before);
    if (options.limit) params.set("limit", String(options.limit));
    const query = params.toString();
    return apiRequest(`/api/conversations/${encodeURIComponent(conversationId)}/messages${query ? `?${query}` : ""}`, { token });
  },
  markRead: (token, conversationId) =>
    apiRequest(`/api/conversations/${encodeURIComponent(conversationId)}/read`, { method: "PATCH", token }),
  sendMessage: (token, conversationId, content) =>
    apiRequest(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      token,
      body: { content },
    }),
};

export const opportunitiesApi = {
  list: (token, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value != null) params.set(key, String(value));
    });
    return apiRequest(`/api/opportunities?${params.toString()}`, { token });
  },
  create: (token, opportunity) => apiRequest("/api/opportunities", { method: "POST", token, body: opportunity }),
  apply: (token, opportunityId, message) => apiRequest(`/api/opportunities/${encodeURIComponent(opportunityId)}/applications`, { method: "POST", token, body: { message } }),
  applications: (token, opportunityId) => apiRequest(`/api/opportunities/${encodeURIComponent(opportunityId)}/applications`, { token }),
  updateApplication: (token, opportunityId, applicationId, status) => apiRequest(`/api/opportunities/${encodeURIComponent(opportunityId)}/applications/${encodeURIComponent(applicationId)}`, { method: "PATCH", token, body: { status } }),
  updateStatus: (token, opportunityId, status) => apiRequest(`/api/opportunities/${encodeURIComponent(opportunityId)}/status`, { method: "PATCH", token, body: { status } }),
};

export const notificationsApi = {
  list: (token) => apiRequest("/api/notifications", { token }),
  markRead: (token, notificationId) => apiRequest(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH", token }),
  markAllRead: (token) => apiRequest("/api/notifications/read-all", { method: "PATCH", token }),
};
