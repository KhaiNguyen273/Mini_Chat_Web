// import { DEFAULT_AVATAR_URL } from '../../constants'

// interface GroupAvatarProps {
//   avatarUrl?: string | null
//   memberAvatars?: (string | undefined)[] // nới lỏng — nơi gọi truyền .map(m => m.avatar_url) vốn có thể undefined
//   size?: number
//   className?: string
// }

// function GroupAvatar({ avatarUrl, memberAvatars, size = 40, className = '' }: GroupAvatarProps) {
  
//   if (avatarUrl) {
//     return (
//       <img
//         src={avatarUrl}
//         alt="Group avatar"
//         className={`rounded-full object-cover shrink-0 ${className}`}
//         style={{ width: size, height: size }}
//       />
//     )
//   }

//   const avatars = memberAvatars || []

//   if (avatars.length === 0) {
//     return (
//       <img
//         src={DEFAULT_AVATAR_URL}
//         alt="Default avatar"
//         className={`rounded-full object-cover shrink-0 ${className}`}
//         style={{ width: size, height: size }}
//       />
//     )
//   }

//   if (avatars.length === 1) {
//     return (
//       <img
//         src={avatars[0] || DEFAULT_AVATAR_URL}
//         alt="Member avatar"
//         className={`rounded-full object-cover shrink-0 ${className}`}
//         style={{ width: size, height: size }}
//       />
//     )
//   }

//   const bigSize = size * 0.62
//   const smallSize = size * 0.5

//   return (
//     <div
//       className={`relative rounded-full overflow-hidden bg-[#e6ebef] shrink-0 ${className}`}
//       style={{ width: size, height: size }}
//     >
//       <img
//         src={avatars[0] || DEFAULT_AVATAR_URL}
//         alt="Member 1"
//         className="absolute rounded-full object-cover"
//         style={{ width: bigSize, height: bigSize, top: 0, left: 0 }}
//       />
//       <img
//         src={avatars[1] || DEFAULT_AVATAR_URL}
//         alt="Member 2"
//         className="absolute rounded-full object-cover border-2 border-white"
//         style={{ width: smallSize, height: smallSize, bottom: 0, right: 0 }}
//       />
//     </div>
//   )
// }

// export default GroupAvatar

import { DEFAULT_AVATAR_URL } from '../../constants'

interface GroupAvatarProps {
  avatarUrl?: string | null
  memberAvatars?: (string | undefined)[]
  size?: number
  className?: string
}

function GroupAvatar({ avatarUrl, memberAvatars, size = 40, className = '' }: GroupAvatarProps) {
  // Có avatar nhóm riêng — dùng luôn, không cần collage
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Group avatar"
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // Không có avatar nhóm -> LUÔN hiện dạng collage 2 ô, dùng DEFAULT_AVATAR_URL
  // làm filler cho ô nào chưa có avatar thật, không rơi về icon đơn nữa —
  // trừ khi chính component cha xác nhận đây KHÔNG phải nhóm (memberAvatars
  // = undefined hẳn, không gọi component này với type='group')
  const avatars = memberAvatars || []
  const first = avatars[0] || DEFAULT_AVATAR_URL
  const second = avatars[1] || DEFAULT_AVATAR_URL

  const bigSize = size * 0.62
  const smallSize = size * 0.5

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-[#e6ebef] shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={first}
        alt="Member 1"
        className="absolute rounded-full object-cover"
        style={{ width: bigSize, height: bigSize, top: 0, left: 0 }}
      />
      <img
        src={second}
        alt="Member 2"
        className="absolute rounded-full object-cover border-2 border-white"
        style={{ width: smallSize, height: smallSize, bottom: 0, right: 0 }}
      />
    </div>
  )
}

export default GroupAvatar