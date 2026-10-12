import api, { API_BASE_URL } from './api';
import { getAuthToken } from './authService';

export const chatService = {
  async sendMessage(message, history = []) {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required.');

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, history }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to connect with Career Assistant.');
    }
    return data;
  },
};

export default chatService;

