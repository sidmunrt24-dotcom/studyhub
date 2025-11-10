import axios from 'axios';
  
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});
  
// Request interceptor to set the latest token and log in development
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyhub_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
  }
  return config;
});
  
// Response interceptor to handle errors with granular handling, logging, and retry logic
httpClient.interceptors.response.use(
  (res) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', res.status, res.config.method?.toUpperCase(), res.config.url);
    }
    return res;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
  
    const status = error.response?.status;
    
    if (status === 400) {
      // Bad request
    } else if (status === 401) {
      // Unauthorized
    } else if (status === 404) {
      // Resource not found
    } else if (status === 500) {
      // Server error
    } else if (status === 503) {
      // Service unavailable
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
    } else if (error.message === 'Network Error') {
      // Network error
    }    // For network errors and timeouts, implement retry logic with exponential backoff
    if ((error.message === 'Network Error' || error.code === 'ECONNABORTED') && error.config) {
      const retryCount = error.config._retryCount || 0;
      if (retryCount < 3) {
        error.config._retryCount = retryCount + 1;
        const delay = 1000 * Math.pow(2, retryCount);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(httpClient.request(error.config));
          }, delay);
        });
      }
    }
  
    return Promise.reject(error);
  }
);
  
export default httpClient;
