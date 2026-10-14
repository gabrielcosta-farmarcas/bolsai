import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useSaveReview } from './useAnalyses';

const wrapper = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

describe('useSaveReview', () => {
  it('deve recarregar combinados, linha do tempo e encontros depois de salvar a revisão', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 'a1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSaveReview('s1'), { wrapper: wrapper(client) });

    result.current.mutate({ analysisId: 'a1', reviewedJson: {} as never });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const keys = invalidate.mock.calls.map((call) => (call[0]?.queryKey as string[])[0]);
    expect(keys).toEqual(
      expect.arrayContaining(['analyses', 'agreements', 'timeline', 'sessions']),
    );
    vi.unstubAllGlobals();
  });
});
