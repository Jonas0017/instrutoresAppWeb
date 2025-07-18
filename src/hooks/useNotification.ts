import { useState, useCallback } from 'react';
import { NotificationType } from '../components/Notification';

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  autoClose?: boolean;
  duration?: number;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    autoClose = true,
    duration = 5000
  ) => {
    const id = Date.now().toString();
    const newNotification: NotificationData = {
      id,
      type,
      title,
      message,
      autoClose,
      duration
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    addNotification('success', title, message);
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string) => {
    addNotification('error', title, message);
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    addNotification('warning', title, message);
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    addNotification('info', title, message);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}; 