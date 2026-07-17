import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados considerados "frescos" por 1 minuto — sem refetch desnecessário
      staleTime: 60_000,
      // Tenta até 2 vezes antes de exibir erro ao usuário
      retry: 2,
      // Revalida ao retornar ao app (foco na janela)
      refetchOnWindowFocus: true,
      // Revalida ao reconectar à internet
      refetchOnReconnect: true,
    },
  },
});
