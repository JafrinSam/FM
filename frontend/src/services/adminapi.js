import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Helper to build FormData automatically
const createFormData = (data, files, fileKey) => {
  const formData = new FormData();
  
  // Append text fields
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });

  // Append files
  if (files) {
    if (files.length !== undefined) {
      // It's a FileList or Array (Multiple)
      Array.from(files).forEach(file => formData.append(fileKey, file));
    } else {
      // Single File
      formData.append(fileKey, files);
    }
  }
  return formData;
};

export const RjAPI = {
  getAll: () => API.get('/rjs'),
  delete: (id) => API.delete(`/rjs/${id}`),
  create: (data, files) => API.post('/rjs', createFormData(data, files, 'photo')),
  update: (id, data, files) => API.put(`/rjs/${id}`, createFormData(data, files, 'photo')),
};

export const ShowAPI = {
  getAll: () => API.get('/shows'),
  delete: (id) => API.delete(`/shows/${id}`),
  create: (data, file) => API.post('/shows', createFormData(data, file, 'CoverImage')),
  update: (id, data, file) => API.put(`/shows/${id}`, createFormData(data, file, 'CoverImage')),
};

export const ScheduleAPI = {
  // We usually fetch schedules via the Show, but this is useful for debugging
  getAll: () => API.get('/weekly-schedules'),
  
  // Create a schedule linked to a show
  // Data: { startTime, endTime, day, show: showId }
  create: (data) => API.post('/weekly-schedules', data),
  
  // Update a specific time slot
  update: (id, data) => API.put(`/weekly-schedules/${id}`, data),
  
  // Delete a time slot
  delete: (id) => API.delete(`/weekly-schedules/${id}`),
};