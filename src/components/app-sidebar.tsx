'use client';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

import { NavUser } from '@/components/nav-user';

import {
  ContactIcon,
  GalleryVerticalEnd,
  LayoutDashboardIcon,
  UsersIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// This is sample data.
const data = {
  navMain: [
    {
      title: 'Workspace',
      url: '/',
      items: [
        {
          title: 'Dashboard',
          icon: LayoutDashboardIcon,
          url: '/',
          isActive: true,
        },
        {
          title: 'Clients',
          icon: ContactIcon,
          url: '/clients',
          isActive: false,
        },
        {
          title: 'Users',
          icon: UsersIcon,
          url: '/users',
          isActive: false,
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  loading = false,
  error,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  loading?: boolean;
  error?: string | null;
}) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='#'>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <GalleryVerticalEnd className='size-4' />
                </div>
                <div className='flex flex-col gap-0.5 leading-none'>
                  <span className='font-medium'>Reporting Tool</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={pathname === item.url}>
                      {item.icon && <item.icon />}
                      <Link href={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        {loading ? (
          <div className='px-4 py-2 text-xs text-muted-foreground'>
            Loading user...
          </div>
        ) : error ? (
          <div className='px-4 py-2 text-xs text-red-500'>
            User error: {error}
          </div>
        ) : (
          <NavUser user={user} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
