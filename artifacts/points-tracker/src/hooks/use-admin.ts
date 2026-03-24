import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCousinId as generatedUseGetCousinId,
  useSetCousinId as generatedUseSetCousinId,
  getGetCousinIdQueryKey
} from "@workspace/api-client-react";

export function useGetCousinId() {
  return generatedUseGetCousinId({
    query: {
      staleTime: Infinity,
    }
  });
}

export function useSetCousinId() {
  const queryClient = useQueryClient();
  
  return generatedUseSetCousinId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCousinIdQueryKey() });
      }
    }
  });
}

interface UserInfo {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export function useGetUserInfo(userId: string | null) {
  return useQuery<UserInfo>({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user info");
      return response.json();
    },
    enabled: !!userId,
  });
}
