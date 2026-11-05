'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const sessionStr = localStorage.getItem('sentinel_admin_session');
    if (sessionStr) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#060911] text-slate-400 font-mono text-xs">
      Verifying Security Clearance...
    </div>
  );
}

