/* frontend/src/utils/axiosConfig.js */
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://vingoapi-vcilbxzx.b4a.run' || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration and network errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle token expiration
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
            return Promise.reject(error);
        }

        // Retry logic for network errors and 5xx errors
        if (!originalRequest._retry && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.response?.status >= 500)) {
            originalRequest._retry = true;
            
            try {
                const response = await axiosInstance(originalRequest);
                return response;
            } catch (retryError) {
                return Promise.reject(retryError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;