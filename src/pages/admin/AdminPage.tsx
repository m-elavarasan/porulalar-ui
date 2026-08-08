import React from 'react';
import AdminPanel from '../../components/AdminPanel';
import { useAuth } from '../../App';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const roleLower = (user?.role || '').toLowerCase();
  const isAdmin = roleLower.includes('admin') || roleLower === 'superadmin' || user?.email === 'admin@porulalar.com';

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 select-none">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600 shadow-xs">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-900">Access Denied: SuperAdmin Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your current account credentials lack server-verified SuperAdmin permissions. Client storage modifications cannot grant administrative access.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Return to Personal Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanel token={token} />
    </div>
  );
}
