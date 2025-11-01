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
  
    const status = error?.response?.status;
    let errorMessage = '';
    let shouldRedirect = false;
  
    if (status === 401) {
      errorMessage = 'Your session has expired. Please login again.';
      shouldRedirect = true;
    } else if (status === 403) {
      errorMessage = 'You do not have permission to access this resource.';
      shouldRedirect = true;
    } else if (status === 500) {
      errorMessage = 'Server is temporarily unavailable. Please try again later.';
    } else if (status === 503) {
      errorMessage = 'Service is temporarily unavailable. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error.message === 'Network Error') {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = 'An unexpected error occurred. Please try again.';
    }
  
    if (shouldRedirect) {
      localStorage.removeItem('studyhub_token');
      sessionStorage.setItem('auth_error', errorMessage);
      sessionStorage.setItem('auth_redirect_needed', 'true');
      // Let AuthContext handle the redirect to avoid conflicts with loading state
    }
  
    // For network errors and timeouts, implement retry logic with exponential backoff
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
