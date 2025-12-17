// src/services/scheduleApi.js

// Adjust the base URL if your API is hosted elsewhere
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper function to handle fetch responses
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  // Delete requests might returns 204 No Content
  if (response.status === 204) return null;
  return response.json();
};

export const scheduleApi = {
  /**
   * Fetch all schedules
   */
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    return handleResponse(response);
  },

  /**
   * Create a new schedule
   * @param {Object} data { hour, minute, filename }
   */
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Update an existing schedule
   * @param {string} id The schedule ID
   * @param {Object} data { hour, minute, filename }
   */
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete a schedule
   * @param {string} id The schedule ID
   */
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

