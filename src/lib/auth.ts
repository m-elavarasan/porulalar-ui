import { authService } from '../services/authService';

export const initAuth = authService.initAuth;
export const backendLogin = authService.backendLogin;
export const backendRegister = authService.backendRegister;
export const googleSignIn = authService.googleSignIn;
export const getAccessToken = authService.getAccessToken;
export const setAccessToken = authService.setAccessToken;
export const logout = authService.logout;
