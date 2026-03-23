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
