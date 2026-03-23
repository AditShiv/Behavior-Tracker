import { useQueryClient } from "@tanstack/react-query";
import { 
  useAdjustPoints as generatedUseAdjustPoints,
  useGetMyPoints as generatedUseGetMyPoints,
  useGetPointsHistory as generatedUseGetPointsHistory,
  getGetMyPointsQueryKey,
  getGetPointsHistoryQueryKey
} from "@workspace/api-client-react";

export function useGetMyPoints() {
  return generatedUseGetMyPoints({
    query: {
      refetchInterval: 10000, // keep points fresh
    }
  });
}

export function useGetPointsHistory() {
  return generatedUseGetPointsHistory();
}

export function useAdjustPoints() {
  const queryClient = useQueryClient();
  
  return generatedUseAdjustPoints({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyPointsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPointsHistoryQueryKey() });
      }
    }
  });
}
