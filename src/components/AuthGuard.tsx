
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Since we're using a mock user, we don't need complex logic.
    // If you switch to real auth, you'll want to check if `user` is null
    // and redirect to '/login' if they are on a protected route.
    if (!loading && user && pathname === '/login') {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 lg:h-[60px] lg:px-6">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="w-full flex-1">
                <Skeleton className="h-8 w-1/3" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
          </header>
          <div className="flex flex-1">
              <aside className="hidden md:block w-64 border-r p-4">
                  <div className="space-y-4">
                      {[...Array(8)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                      ))}
                  </div>
              </aside>
              <main className="flex-1 p-8 space-y-4">
                  <Skeleton className="h-10 w-1/4" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
              </main>
          </div>
      </div>
    );
  }

  // If using real auth and redirecting, you might return null here.
  // if (!user && pathname !== '/login') {
  //   return null; 
  // }
  
  return <>{children}</>;
}
