import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
    mutations: {
      retry: 1,
    },
  },
})

// Remover loader inicial quando React carrega
const removeInitialLoader = () => {
  setTimeout(() => {
    const loader = document.getElementById('initial-loader')
    if (loader) {
      loader.style.opacity = '0'
      setTimeout(() => {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader)
        }
      }, 500)
    }
  }, 200)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        {/* React Query DevTools apenas em desenvolvimento */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

// Remover loader após o React carregar
removeInitialLoader()