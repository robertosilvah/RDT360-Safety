
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Siren,
  Eye,
  ClipboardCheck,
  Wrench,
  FileText,
  Map,
  BadgeCheck,
  Settings,
  FileSignature,
  Flame,
  Truck,
  FileSearch,
} from 'lucide-react';
import { Header } from './Header';
import { Button } from './ui/button';
import { Card, CardDescription } from './ui/card';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/incidents', label: 'Incidents', icon: Siren },
  { href: '/investigations', label: 'Investigations', icon: FileSearch },
  { href: '/observations', label: 'Observations', icon: Eye },
  { href: '/audits', label: 'Safety Walks', icon: ClipboardCheck },
  { href: '/actions', label: 'Corrective Actions', icon: Wrench },
  { href: '/jsa', label: 'JSAs', icon: FileSignature },
  { href: '/hot-work', label: 'Hot Work Permits', icon: Flame },
  { href: '/forklift-inspections', label: 'Forklift Inspections', icon: Truck },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/areas', label: 'Areas', icon: Map },
  { href: '/compliance', label: 'Compliance', icon: BadgeCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary">
              <Siren className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg">RDT360-Safety</span>
              <span className="text-xs text-muted-foreground">
                Safety Insights
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="space-y-2">
           <Card className="bg-accent/20 border-accent/50">
                <CardDescription className="p-4 text-xs text-foreground/80">
                    <strong className="font-semibold text-foreground">Need help?</strong> Visit our help center or contact support for assistance.
                    <Button size="sm" className="w-full mt-3" variant="outline">Contact Support</Button>
                </CardDescription>
            </Card>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                <Link href="/settings/users">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
