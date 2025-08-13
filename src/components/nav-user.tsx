'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';

export function NavUser({
  user,
}: {
  user?: {
    name: string;
    email: string;
    avatar: string;
  } | null;
}) {
  const { isMobile } = useSidebar();
  const { user: contextUser, profile } = useAuth();
  let displayUser: { name: string; email: string; avatar: string } | null =
    null;
  if (user && user.name && user.email && user.avatar) {
    displayUser = user;
  } else if (profile) {
    displayUser = {
      name: profile.full_name || '',
      email: (profile as any).email || contextUser?.email || '',
      avatar: profile.avatar_url || '/avatars/default.png',
    };
  } else if (contextUser) {
    displayUser = {
      name: contextUser.user_metadata?.full_name || contextUser.email || '',
      email: contextUser.email || '',
      avatar: '/avatars/default.png',
    };
  }
  if (!displayUser) return null;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                <AvatarFallback className='rounded-lg'>JM</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{displayUser.name}</span>
                <span className='truncate text-xs'>{displayUser.email}</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage
                    src={displayUser.avatar}
                    alt={displayUser.name}
                  />
                  <AvatarFallback className='rounded-lg'>JM</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    {displayUser.name}
                  </span>
                  <span className='truncate text-xs'>{displayUser.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={async () => {
                try {
                  const res = await fetch('/api/v1/auth/logout', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  if (res.ok) {
                    window.location.reload();
                  } else {
                    alert('Logout failed');
                  }
                } catch (err) {
                  alert('Logout error');
                }
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
