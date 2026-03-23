import { useQueryClient } from "@tanstack/react-query";
import {
  useListRedemptions as generatedUseListRedemptions,
  useCreateRedemption as generatedUseCreateRedemption,
  useReviewRedemption as generatedUseReviewRedemption,
  getListRedemptionsQueryKey,
  getGetMyPointsQueryKey,
  getGetPointsHistoryQueryKey
} from "@workspace/api-client-react";

export function useListRedemptions() {
  return generatedUseListRedemptions({
    query: {
      refetchInterval: 15000,
    }
  });
}

export function useCreateRedemption() {
  const queryClient = useQueryClient();
  
  return generatedUseCreateRedemption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRedemptionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyPointsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPointsHistoryQueryKey() });
      }
    }
  });
}

export function useReviewRedemption() {
  const queryClient = useQueryClient();
  
  return generatedUseReviewRedemption({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRedemptionsQueryKey() });
        // The cousin's points/history might change if accepted, but we are admin here.
        // It's still good practice to invalidate in case admin fetches history
        queryClient.invalidateQueries({ queryKey: getGetPointsHistoryQueryKey() });
      }
    }
  });
}
