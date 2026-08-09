import { Outlet } from 'react-router-dom'

function ProfileWindow() {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <Outlet />
    </div>
  )
}

export default ProfileWindow