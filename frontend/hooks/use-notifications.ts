"use client";

import { useApiClient } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { NotificationItem } from "@/types";

interface NotificationListResponse {
  notifications: Array<{
    id: string;
    type: string;
    category: string;
    title: string;
    message: string;
    action_url?: string | null;
    session_id?: string | null;
    result_id?: string | null;
    is_read: boolean;
    created_at: string;
  }>;
  total: number;
  unread_count: number;
}

interface UnreadCountResponse {
  count: number;
}

const mapNotification = (item: NotificationListResponse["notifications"][number]): NotificationItem => ({
  id: item.id,
  type: (item.type as NotificationItem["type"]) ?? "info",
  category: item.category,
  title: item.title,
  message: item.message,
  actionUrl: item.action_url ?? undefined,
  sessionId: item.session_id ?? undefined,
  resultId: item.result_id ?? undefined,
  isRead: item.is_read,
  createdAt: new Date(item.created_at),
});

// Deep equality check for notifications array
function notificationsEqual(a: NotificationItem[], b: NotificationItem[]): boolean {
  if (a.length !== b.length) return false;
  
  const aMap = new Map(a.map(n => [n.id, n]));
  const bMap = new Map(b.map(n => [n.id, n]));
  
  for (const notification of a) {
    const other = bMap.get(notification.id);
    if (!other) return false;
    
    // Compare all relevant fields
    if (
      notification.type !== other.type ||
      notification.category !== other.category ||
      notification.title !== other.title ||
      notification.message !== other.message ||
      notification.actionUrl !== other.actionUrl ||
      notification.sessionId !== other.sessionId ||
      notification.resultId !== other.resultId ||
      notification.isRead !== other.isRead ||
      notification.createdAt.getTime() !== other.createdAt.getTime()
    ) {
      return false;
    }
  }
  
  return true;
}

export function useNotifications() {
  const { get, post } = useApiClient();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousNotificationsRef = useRef<NotificationItem[]>([]);
  const previousTotalRef = useRef(0);
  const previousUnreadCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await get<NotificationListResponse>("/api/notifications?limit=20");
      const newNotifications = data.notifications.map(mapNotification);
      
      // Only update if data actually changed (memoization)
      if (!notificationsEqual(newNotifications, previousNotificationsRef.current)) {
        previousNotificationsRef.current = newNotifications;
        setNotifications(newNotifications);
      }
      
      // Only update counts if they changed
      if (data.total !== previousTotalRef.current) {
        previousTotalRef.current = data.total;
        setTotal(data.total);
      }
      
      if (data.unread_count !== previousUnreadCountRef.current) {
        previousUnreadCountRef.current = data.unread_count;
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
      try {
        await post("/api/notifications/mark-all-read");
      await fetchNotifications();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to mark notifications as read";
      setError(message);
    }
  }, [fetchNotifications, post]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const updated = await post<NotificationListResponse["notifications"][number]>(
          `/api/notifications/${id}/read`
        );
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? mapNotification(updated) : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update notification";
        setError(message);
      }
    },
    [post]
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const result = await get<UnreadCountResponse>("/api/notifications/unread-count");
      setUnreadCount(result.count);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch unread count";
      setError(message);
    }
  }, [get]);

  return useMemo(
    () => ({
      notifications,
      total,
      unreadCount,
      isLoading,
      error,
      markAllAsRead,
      markAsRead,
      refresh: fetchNotifications,
      refreshUnreadCount,
    }),
    [
      notifications,
      total,
      unreadCount,
      isLoading,
      error,
      markAllAsRead,
      markAsRead,
      fetchNotifications,
      refreshUnreadCount,
    ]
  );
}

