'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Bell, Search, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';
import React from 'react';
import { isPast, formatDistanceToNowStrict } from 'date-fns';

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const { correctiveActions, incidents } = useAppData();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  const notifications = React.useMemo(() => {
    const allNotifications: {id: string; title: string; description: string; link: string; icon: React.ElementType}[] = [];

    // Overdue Actions
    const overdueActions = correctiveActions.filter(
        (action) => action.status !== 'Completed' && isPast(new Date(action.due_date))
    );
    overdueActions.forEach(action => {
        allNotifications.push({
            id: `action-${action.action_id}`,
            title: `Action Overdue by ${formatDistanceToNowStrict(new Date(action.due_date))}`,
            description: action.description,
            link: '/actions',
            icon: Clock,
        });
    });

    // High Severity Incidents
    const highSeverityIncidents = incidents.filter(
        (incident) => incident.severity === 'High' && incident.status !== 'Closed'
    );
     highSeverityIncidents.forEach(incident => {
        allNotifications.push({
            id: `incident-${incident.incident_id}`,
            title: 'High Severity Incident',
            description: incident.description,
            link: `/incidents`,
            icon: AlertCircle,
        });
    });
    
    return allNotifications.slice(0, 5); // Limit to 5 notifications
  }, [correctiveActions, incidents]);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-40">
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {notifications.length}
                    </span>
                )}
                <span className="sr-only">Toggle notifications</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
                notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
                        <Link href={notification.link} className="items-start">
                            <notification.icon className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-tight">{notification.title}</span>
                                <span className="text-xs text-muted-foreground truncate">{notification.description}</span>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                ))
            ) : (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
            )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
              {user?.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.displayName || 'User Avatar'} data-ai-hint="user avatar" />
              ): (
                <AvatarImage src="https://placehold.co/40x40" alt="User Avatar" data-ai-hint="user avatar" />
              )}
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.displayName || "My Account"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings/users">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="mailto:support@example.com">Support</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleLogout(); }}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
