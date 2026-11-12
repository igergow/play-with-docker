// API service layer with typed fetch wrappers
import type {
  User,
  Playground,
  Session,
  Instance,
  SessionSetupRequest,
  NewInstanceRequest,
  FileTreeNode,
} from './types';

const API_BASE = '';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new APIError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export const api = {
  // User endpoints
  async getCurrentUser(): Promise<User> {
    return fetchAPI<User>('/users/me');
  },

  async getUser(userId: string): Promise<User> {
    return fetchAPI<User>(`/users/${userId}`);
  },

  async nicknameLogin(nickname: string): Promise<User> {
    return fetchAPI<User>('/users/nickname', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
  },

  // OAuth endpoints
  async getOAuthProviders(): Promise<string[]> {
    return fetchAPI<string[]>('/oauth/providers');
  },

  // Playground endpoints
  async getCurrentPlayground(): Promise<Playground> {
    return fetchAPI<Playground>('/my/playground');
  },

  // Session endpoints
  async createSession(data?: {
    stack?: string;
    stack_name?: string;
    image_name?: string;
  }): Promise<Session> {
    const formData = new FormData();
    if (data?.stack) formData.append('stack', data.stack);
    if (data?.stack_name) formData.append('stack_name', data.stack_name);
    if (data?.image_name) formData.append('image_name', data.image_name);

    const response = await fetch(`${API_BASE}/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new APIError(response.status, `HTTP ${response.status}`);
    }

    return response.json();
  },

  async getSession(sessionId: string): Promise<Session> {
    return fetchAPI<Session>(`/sessions/${sessionId}`);
  },

  async closeSession(sessionId: string): Promise<void> {
    return fetchAPI<void>(`/sessions/${sessionId}/close`, {
      method: 'POST',
    });
  },

  async setupSession(sessionId: string, data: SessionSetupRequest): Promise<void> {
    return fetchAPI<void>(`/sessions/${sessionId}/setup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Instance endpoints
  async createInstance(sessionId: string, data?: NewInstanceRequest): Promise<Instance> {
    return fetchAPI<Instance>(`/sessions/${sessionId}/instances`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  async deleteInstance(sessionId: string, instanceName: string): Promise<void> {
    return fetchAPI<void>(`/sessions/${sessionId}/instances/${instanceName}`, {
      method: 'DELETE',
    });
  },

  async execCommand(
    sessionId: string,
    instanceName: string,
    command: string
  ): Promise<{ output: string }> {
    return fetchAPI<{ output: string }>(
      `/sessions/${sessionId}/instances/${instanceName}/exec`,
      {
        method: 'POST',
        body: JSON.stringify({ command }),
      }
    );
  },

  async getInstanceImages(): Promise<string[]> {
    return fetchAPI<string[]>('/instances/images');
  },

  // File operations
  async uploadFile(
    sessionId: string,
    instanceName: string,
    file: File
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_BASE}/sessions/${sessionId}/instances/${instanceName}/uploads`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new APIError(response.status, `HTTP ${response.status}`);
    }
  },

  async getFileTree(sessionId: string, instanceName: string): Promise<FileTreeNode> {
    return fetchAPI<FileTreeNode>(
      `/sessions/${sessionId}/instances/${instanceName}/fstree`
    );
  },

  async getFile(
    sessionId: string,
    instanceName: string,
    path: string
  ): Promise<string> {
    const response = await fetch(
      `${API_BASE}/sessions/${sessionId}/instances/${instanceName}/file?path=${encodeURIComponent(
        path
      )}`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new APIError(response.status, `HTTP ${response.status}`);
    }

    return response.text();
  },
};

