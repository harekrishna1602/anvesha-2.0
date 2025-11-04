"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { getNotifications, markNotificationAsRead } from '@/services/notificationService';
import { useSession } from '@/components/SessionContextProvider';
import { Tables } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

const NotificationsDropdown: React.FC = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getNotifications(userId!),
    enabled: !!userId,
    refetchInterval: 5000, // Refetch every 5 seconds to get new notifications
  });

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (err) => {
      toast.error(`Failed to mark notification as read: ${err.message}`);
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (!userId) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadNotifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadNotifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem className="text-center text-muted-foreground">Loading...</DropdownMenuItem>
        ) : error ? (
          <DropdownMenuItem className="text-center text-destructive">Error: {error.message}</DropdownMenuItem>
        ) : notifications && notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification: Tables<'notifications'>) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start space-y-1 p-2 relative"
                onSelect={(e) => e.preventDefault()} // Prevent closing dropdown on item click
              >
                <div className="flex justify-between w-full">
                  <p className={`text-sm ${notification.is_read ? 'text-muted-foreground' : 'font-medium'}`}>
                    {notification.message}
                  </p>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute top-1 right-1"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markAsReadMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 text-gray-500" />
                    </Button>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at!), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <DropdownMenuItem className="text-center text-muted-foreground">No new notifications.</DropdownMenuItem>
        )}
        {unreadNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => unreadNotifications.forEach(n => handleMarkAsRead(n.id))}>
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;