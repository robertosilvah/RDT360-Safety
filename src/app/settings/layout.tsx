
'use client';

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Truck, ListChecks, FolderTree, Paintbrush, Upload, Database, Shield } from 'lucide-react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const activeTab = pathname.includes('/users') ? 'users' 
        : pathname.includes('/groups') ? 'groups'
        : pathname.includes('/forklifts') ? 'forklifts' 
        : pathname.includes('/checklist') ? 'checklist' 
        : pathname.includes('/areas') ? 'areas'
        : pathname.includes('/branding') ? 'branding'
        : pathname.includes('/uploads') ? 'uploads'
        : pathname.includes('/sql-export') ? 'sql-export'
        : pathname.includes('/database') ? 'database'
        : '';

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
                    <TabsList className="overflow-x-auto h-auto py-1">
                        <TabsTrigger value="users" asChild>
                           <Link href="/settings/users">
                               <Users className="mr-2 h-4 w-4" /> Users
                           </Link>
                        </TabsTrigger>
                         <TabsTrigger value="groups" asChild>
                           <Link href="/settings/groups">
                               <Shield className="mr-2 h-4 w-4" /> Groups & Permissions
                           </Link>
                        </TabsTrigger>
                         <TabsTrigger value="areas" asChild>
                           <Link href="/settings/areas">
                               <FolderTree className="mr-2 h-4 w-4" /> Areas
                           </Link>
                        </TabsTrigger>
                        <TabsTrigger value="forklifts" asChild>
                           <Link href="/settings/forklifts">
                               <Truck className="mr-2 h-4 w-4" /> Forklifts
                           </Link>
                        </TabsTrigger>
                        <TabsTrigger value="checklist" asChild>
                           <Link href="/settings/checklist">
                               <ListChecks className="mr-2 h-4 w-4" /> Checklist Items
                           </Link>
                        </TabsTrigger>
                        <TabsTrigger value="branding" asChild>
                           <Link href="/settings/branding">
                               <Paintbrush className="mr-2 h-4 w-4" /> Branding
                           </Link>
                        </TabsTrigger>
                         <TabsTrigger value="uploads" asChild>
                           <Link href="/settings/uploads">
                               <Upload className="mr-2 h-4 w-4" /> File Uploads
                           </Link>
                        </TabsTrigger>
                         <TabsTrigger value="database" asChild>
                           <Link href="/settings/database">
                               <Database className="mr-2 h-4 w-4" /> Database
                           </Link>
                        </TabsTrigger>
                         <TabsTrigger value="sql-export" asChild>
                           <Link href="/settings/sql-export">
                               <Database className="mr-2 h-4 w-4" /> SQL Export
                           </Link>
                        </TabsTrigger>
                    </TabsList>
                    <div className="pt-4">{children}</div>
                </Tabs>
            </div>
        </AppShell>
    )
}
