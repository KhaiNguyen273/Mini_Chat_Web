import ToastContainer from './components/ui/ToastContainer'
import AppRouter from './routes/AppRouter'
import { ToastProvider } from './stores/toastStore'
import { ConfirmProvider } from './stores/confirmStore'
import ConfirmDialog from './components/ui/ConfirmDialog'
import { PresenceProvider } from './contexts/PresenceContext'

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <PresenceProvider>
          <AppRouter />
          <ToastContainer />
          <ConfirmDialog />
        </PresenceProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App