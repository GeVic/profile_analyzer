import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { trpc, trpcClient } from './lib/trpc';
import ProfileAnalyzer from './components/analysis/ProfileAnalyzer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="app-container">
          <header className="header">
            <h1>AI Profile Analyzer</h1>
            <p>
              Upload a job description and CV to get AI-powered insights on candidate fit,
              strengths, and areas for improvement.
            </p>
          </header>

          <div className="content-container">
            <ProfileAnalyzer />
          </div>
        </div>


      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
