const rawUrl = import.meta.env.VITE_API_URL || '';

export const API_BASE = (() => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
})();

export const getHeaders = () => {
  const token = localStorage.getItem('porulalar_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};
