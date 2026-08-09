// src/routes/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ContactsPage from '../pages/ContactsPage'
import PendingPage from '../pages/PendingPage'
import ChatPage from '../pages/ChatPage'
import ProfilePage from '../pages/ProfilePage'
import ProfileDetails from '../components/profile/ProfileDetails'
import ProfileSecurity from '../components/profile/ProfileSecurity'
import ProfileNotification from '../components/profile/ProfileNotification'
import ProtectedRoute from './ProtectedRoute'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* "/" tự động chuyển sang /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/chat/:conversationId?" element={<ChatPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/profile" element={<ProfilePage />}>
            <Route index element={<ProfileDetails />} />
            <Route path="security" element={<ProfileSecurity />} />
            <Route path="notifications" element={<ProfileNotification />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter