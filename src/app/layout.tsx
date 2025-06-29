import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppDataProvider } from '@/context/AppDataContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'RDT360-Safety Insights',
  description: 'A web-based platform for a Safety Department that allows tracking of incidents, safety observations, audits, corrective actions, and compliance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <AppDataProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
            </AppDataProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
