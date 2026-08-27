const getBaseUrl = (): string => {
  // 1. Runtime override if configured on window or local storage
  if (typeof window !== 'undefined' && (window as any).__PORULALAR_API_URL__) {
    return (window as any).__PORULALAR_API_URL__.replace(/\/+$/, '');
  }

  // 2. Build-time environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If published on a remote domain/IP, never use hardcoded localhost:8080
    if (!isLocal && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return ''; // Use relative /api on current origin
    }
  }

  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. In production environments without explicit VITE_API_URL, default to same-origin relative
  if (import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
    return '';
  }

  // 4. Default for local dev
  return 'http://localhost:8080';
};

export const API_BASE = getBaseUrl();

export const getHeaders = () => {
  const token = localStorage.getItem('porulalar_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};
