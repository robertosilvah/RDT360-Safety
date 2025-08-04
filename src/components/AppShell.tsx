
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  FileEdit,
  ChevronRight,
  Box,
  BookCopy,
  HelpCircle,
} from 'lucide-react';
import { Header } from './Header';
import { Button } from './ui/button';
import { Card, CardDescription } from './ui/card';
import { useAppData } from '@/context/AppDataContext';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/incidents', label: 'Incidents', icon: Siren },
  { href: '/investigations', label: 'Investigations', icon: FileSearch },
  { href: '/observations', label: 'Observations', icon: Eye },
  { href: '/audits', label: 'Safety Walks', icon: ClipboardCheck },
  { href: '/actions', label: 'Corrective Actions', icon: Wrench },
  { 
    label: 'Permits', 
    icon: FileEdit,
    subPath: ['/hot-work', '/confined-space'],
    items: [
      { href: '/hot-work', label: 'Hot Work Permits', icon: Flame },
      { href: '/confined-space', label: 'Confined Space', icon: Box },
    ]
  },
  {
    label: 'Tools',
    icon: Wrench,
    subPath: ['/jsa', '/forklift-inspections'],
    items: [
      { href: '/jsa', label: 'JSAs', icon: FileSignature },
      { href: '/forklift-inspections', label: 'Forklift Inspections', icon: Truck },
    ]
  },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/areas', label: 'Areas', icon: Map },
  { href: '/compliance', label: 'Compliance', icon: BadgeCheck },
  { href: '/reporting', label: 'Reporting', icon: BookCopy },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { brandingSettings } = useAppData();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const newOpenSections: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if ('items' in item && item.subPath?.some(p => pathname.startsWith(p))) {
        newOpenSections[item.label] = true;
      }
    });
    setOpenSections(prev => ({...prev, ...newOpenSections}));
  }, [pathname]);

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({...prev, [label]: !prev[label]}));
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary h-10 w-10 flex items-center justify-center">
              {brandingSettings?.logoUrl ? (
                <Image src={brandingSettings.logoUrl} alt="Company Logo" width={32} height={32} className="object-contain" />
              ) : (
                <Siren className="w-6 h-6 text-primary-foreground" />
              )}
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
            {menuItems.map((item) => {
              if ('items' in item) {
                 const isActive = item.subPath.some(path => pathname.startsWith(path));
                 return (
                    <SidebarMenuItem key={item.label}>
                      <Collapsible open={openSections[item.label] || false} onOpenChange={() => toggleSection(item.label)}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className="w-full justify-between"
                            isActive={isActive}
                          >
                            <div className="flex items-center gap-2">
                              <item.icon />
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", openSections[item.label] && "rotate-90")} />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                  <Link href={subItem.href}>
                                    <subItem.icon />
                                    <span>{subItem.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                 )
              }
              return (
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
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/help')}>
                    <Link href="/help">
                        <HelpCircle />
                        <span>Help</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
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
