import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';

// Generic hook for API queries
export const useApiQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Generic hook for API mutations
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: any) => void;
    invalidateQueries?: string[][];
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error(error.response?.data?.error || 'An error occurred');
      options?.onError?.(error);
    },
  });
};

// Specific hooks for common operations
export const useUsers = () => useApiQuery(['users'], apiService.getUsers);
export const useUser = (id: number) => useApiQuery(['user', id], () => apiService.getUserById(id));
export const useEvaluations = () => useApiQuery(['evaluations'], apiService.getEvaluations);
export const useCriteria = () => useApiQuery(['criteria'], apiService.getCriteria);
export const useEmployees = () => useApiQuery(['employees'], apiService.getEmployees);
export const useTodos = (userId: number) => useApiQuery(['todos', userId], () => apiService.getTodos(userId));

// Mutation hooks
export const useCreateUser = () => useApiMutation(apiService.createUser, {
  invalidateQueries: [['users']],
  onSuccess: () => toast.success('User created successfully'),
});

export const useUpdateUser = () => useApiMutation(
  ({ id, data }: { id: number; data: Partial<any> }) => apiService.updateUser(id, data),
  {
    invalidateQueries: [['users']],
    onSuccess: () => toast.success('User updated successfully'),
  }
);

export const useDeleteUser = () => useApiMutation(
  (id: number) => apiService.deleteUser(id),
  {
    invalidateQueries: [['users']],
    onSuccess: () => toast.success('User deleted successfully'),
  }
);
