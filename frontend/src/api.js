const API_BASE = ""; // Relative URLs will be proxied by Vite in dev, and served from the same host in production.

let token = localStorage.getItem("token") || "";

export function setToken(newToken) {
  token = newToken;
  if (newToken) {
    localStorage.setItem("token", newToken);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken() {
  return token;
}

async function request(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      setToken(""); // Clear invalid/expired token
      window.dispatchEvent(new Event("unauthorized"));
    }
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  getToken() {
    return token;
  },
  // Auth
  async login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  async register(name, email, password) {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  logout() {
    setToken("");
    localStorage.removeItem("user");
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  },

  // Tasks
  async getTasks({ status, search, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    params.append("page", page);
    params.append("limit", limit);

    return request(`/tasks?${params.toString()}`);
  },

  async createTask(taskData) {
    return request("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(id, taskData) {
    return request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  },

  async deleteTask(id) {
    return request(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async getRemindersToday() {
    return request("/tasks/reminders/today");
  },

  // Notes
  async getNotes(taskId) {
    return request(`/tasks/${taskId}/notes`);
  },

  async createNote(taskId, body) {
    return request(`/tasks/${taskId}/notes`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },

  async deleteNote(taskId, noteId) {
    return request(`/tasks/${taskId}/notes/${noteId}`, {
      method: "DELETE",
    });
  },
};
