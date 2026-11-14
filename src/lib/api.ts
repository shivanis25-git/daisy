import { AuthResponse, DirectoryUser, Email, EmailsResponse, User, UserPreferences } from '../types.js';

const TOKEN_KEY = 'daisy_auth_token';
const USER_KEY = 'daisy_auth_user';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // If the port is 3000 (standard server), relative URLs work directly
    if (window.location.port === '3000') {
      return '';
    }
    // If running in development on a different port (e.g. 5173, 5500), connect to backend at port 3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return '';
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getCachedUser(): User | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setCachedUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(
      `Cannot connect to Daisy server at ${baseUrl || window.location.origin}. Make sure 'npm run dev' is running in your terminal.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  async register(name: string, email: string, password: string, role?: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    setToken(res.token);
    setCachedUser(res.user);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setCachedUser(res.user);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await request<{ user: User }>('/api/auth/me');
    setCachedUser(res.user);
    return res;
  },

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<{ user: User }> {
    const res = await request<{ user: User }>('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    });
    setCachedUser(res.user);
    return res;
  },

  async getDirectory(): Promise<{ users: DirectoryUser[] }> {
    return request<{ users: DirectoryUser[] }>('/api/users/directory');
  },

  async getEmails(): Promise<EmailsResponse> {
    return request<EmailsResponse>('/api/emails');
  },

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean; email: Email }> {
    return request<{ success: boolean; email: Email }>('/api/emails/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    });
  },

  async markEmailAsRead(id: string, isRead: boolean): Promise<{ email: Email }> {
    return request<{ email: Email }>(`/api/emails/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead }),
    });
  },

  async toggleStar(id: string): Promise<{ email: Email }> {
    return request<{ email: Email }>(`/api/emails/${id}/star`, {
      method: 'PATCH',
    });
  },

  async deleteEmail(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/emails/${id}`, {
      method: 'DELETE',
    });
  },
};
