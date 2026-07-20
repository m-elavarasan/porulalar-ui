import React from 'react';
import AdminPanel from '../../components/AdminPanel';
import { useAuth } from '../../App';

export default function AdminPage() {
  const { user, token } = useAuth();
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <AdminPanel token={token} />
    </div>
  );
}
