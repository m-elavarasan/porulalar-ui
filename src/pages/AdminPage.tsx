import React from 'react';
import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';

export default function AdminPage() {
  const { user, token } = useAuth();

  // Guard: if user is not logged in or is not an admin, redirect to dashboard
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminPanel token={token} />
  );
}
