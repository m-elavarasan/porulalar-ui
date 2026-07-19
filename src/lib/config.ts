export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const getHeaders = () => {
  const token = localStorage.getItem('porulalar_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};
