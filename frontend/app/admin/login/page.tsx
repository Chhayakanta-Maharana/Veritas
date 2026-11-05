'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#060813] text-slate-400 font-mono text-xs">
      Redirecting to Unified Forensics Access Portal...
    </div>
  );
}
