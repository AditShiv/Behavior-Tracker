import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotifications as generatedUseListNotifications,
  useMarkNotificationRead as generatedUseMarkNotificationRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";

export function useListNotifications() {
  return generatedUseListNotifications({
    query: {
      refetchInterval: 10000,
    }
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return generatedUseMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    }
  });
}
