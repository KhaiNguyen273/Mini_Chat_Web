import ToastContainer from './components/ui/ToastContainer'
import AppRouter from './routes/AppRouter'
import { ToastProvider } from './stores/toastStore'

function App() {
  return <ToastProvider>
    <AppRouter />
    <ToastContainer />
</ToastProvider> 
  
}

export default App