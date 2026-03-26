import { useEffect, useState } from 'react';

/** @deprecated - use direct supabase queries instead */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await queryFn();

        if (isMounted) {
          if (result.error) {
            setError(result.error);
            setData(null);
          } else {
            setData(result.data);
            setError(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, isLoading };
}