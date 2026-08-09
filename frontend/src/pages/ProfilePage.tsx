import ProfileSidebar from '../components/profile/ProfileSidebar'
import ProfileWindow from '../components/window/profile/ProfileWindow'
import MainLayout from '../templates/MainLayout'

function ProfilePage() {
  return (
    <MainLayout>
      <ProfileSidebar />
      <ProfileWindow />
    </MainLayout>
  )
}

export default ProfilePage