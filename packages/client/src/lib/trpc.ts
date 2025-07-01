import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../../../server/src/trpc/router';

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Server URL configuration
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  }
  return 'http://localhost:3000';
};

// tRPC client configuration
export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (_opts) =>
        import.meta.env.DEV && typeof window !== 'undefined',
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
});

// Utility function to process PDF files
export const processPDFFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getBaseUrl()}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process PDF file');
  }

  const data = await response.json();
  return data.content;
};

// Utility function to check if an error is a tRPC client error
export const isTRPCClientError = (error: unknown): error is { message: string; data?: any } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
};
