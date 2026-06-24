import { useEffect, useState } from 'react'
import api from '../api/axios'

function Home() {
  const [status, setStatus] = useState('')

  useEffect(() => {
    api.get('/')
      .then(res => setStatus(res.data.message))
      .catch(() => setStatus('Cannot connect to server'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to MiniChat 💬
        </h1>
        <p className="text-gray-500 text-lg mb-2">
          Your real-time chat application
        </p>
        <p className="text-sm text-green-500">
          Server: {status || 'Connecting...'}
        </p>
      </div>
    </div>
  )
}

export default Home