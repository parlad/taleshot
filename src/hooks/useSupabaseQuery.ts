import { useState, useEffect, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';

interface UseSupabaseQueryResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  deps: any[] = []
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<PostgrestError | Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await queryFn();
      
      if (result.error) {
        setError(result.error);
        setData(null);
        console.error('Query error:', result.error);
      } else if (result.data === null) {
        setData(null);
        setError(null);
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      console.error('Query error:', error);
      setError(error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn]);

  useEffect(() => {
    let mounted = true;

    const execute = async () => {
      try {
        if (mounted) {
          await fetchData();
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error('An error occurred');
          console.error('Effect error:', error);
          setError(error);
        }
      }
    };

    execute();

    return () => {
      mounted = false;
    };
  }, [...deps, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { 
    data, 
    error, 
    isLoading, 
    refetch 
  };
}