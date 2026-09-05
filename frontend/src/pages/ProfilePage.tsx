import { useLocation } from 'react-router-dom'
import ProfileSidebar from '../components/profile/ProfileSidebar'
import ProfileWindow from '../components/window/profile/ProfileWindow'
import MainLayout from '../templates/MainLayout'

function ProfilePage() {
  const { pathname } = useLocation()
  const isIndex = pathname === '/profile' || pathname === '/profile/'

  return (
    <MainLayout>
      <ProfileSidebar className={isIndex ? 'flex' : 'hidden'} />
      <div className={`${isIndex ? 'hidden' : 'flex'} md:flex flex-1 min-w-0`}>
        <ProfileWindow />
      </div>
    </MainLayout>
  )
}

export default ProfilePage