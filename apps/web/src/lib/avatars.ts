export interface AvatarOption {
  id: string
  name: string
  path: string
}

export const AVATARS: AvatarOption[] = [
  { id: 'avatar-01', name: '猫', path: '/avatars/avatar-01.svg' },
  { id: 'avatar-02', name: '狗', path: '/avatars/avatar-02.svg' },
  { id: 'avatar-03', name: '兔子', path: '/avatars/avatar-03.svg' },
  { id: 'avatar-04', name: '熊', path: '/avatars/avatar-04.svg' },
  { id: 'avatar-05', name: '狐狸', path: '/avatars/avatar-05.svg' },
  { id: 'avatar-06', name: '熊猫', path: '/avatars/avatar-06.svg' },
  { id: 'avatar-07', name: '企鹅', path: '/avatars/avatar-07.svg' },
  { id: 'avatar-08', name: '老虎', path: '/avatars/avatar-08.svg' },
  { id: 'avatar-09', name: '龙', path: '/avatars/avatar-09.svg' },
  { id: 'avatar-10', name: '猴子', path: '/avatars/avatar-10.svg' },
  { id: 'avatar-11', name: '鸡', path: '/avatars/avatar-11.svg' },
  { id: 'avatar-12', name: '牛', path: '/avatars/avatar-12.svg' },
  { id: 'avatar-13', name: '猪', path: '/avatars/avatar-13.svg' },
  { id: 'avatar-14', name: '蛇', path: '/avatars/avatar-14.svg' },
  { id: 'avatar-15', name: '马', path: '/avatars/avatar-15.svg' },
  { id: 'avatar-16', name: '羊', path: '/avatars/avatar-16.svg' },
]

export function getAvatarById(id: string): AvatarOption | undefined {
  return AVATARS.find(a => a.id === id)
}
