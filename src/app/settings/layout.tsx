'use client';

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Truck } from 'lucide-react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const activeTab = pathname.includes('/users') ? 'users' : pathname.includes('/forklifts') ? 'forklifts' : '';

    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                 <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                        <p className="text-muted-foreground">Manage your application settings, users, and equipment.</p>
                    </div>
                </div>

                <Tabs value={activeTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users" asChild>
                           <Link href="/settings/users">
                               <Users className="mr-2 h-4 w-4" /> Users
                           </Link>
                        </TabsTrigger>
                        <TabsTrigger value="forklifts" asChild>
                           <Link href="/settings/forklifts">
                               <Truck className="mr-2 h-4 w-4" /> Forklifts
                           </Link>
                        </TabsTrigger>
                    </TabsList>
                    <div className="pt-4">{children}</div>
                </Tabs>
            </div>
        </AppShell>
    )
}
