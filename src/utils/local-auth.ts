// 完全本地化的账号系统 - 无需服务器
// 用户信息存储在 localStorage 中

export interface LocalUser {
  id: string
  email: string
  username: string
  avatar?: string
  brandSettings: {
    logo: string | null
    qrcode: string | null
    dividers: string[]
    brandColors: string[]
    customCSS: string
  }
  preferences: {
    theme: 'light' | 'dark'
    autoSave: boolean
    defaultTemplate: string
  }
  createdAt: string
}

const STORAGE_KEY = 'local_users'
const CURRENT_USER_KEY = 'current_local_user'

// 获取所有本地用户
function getAllUsers(): LocalUser[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// 保存用户列表
function saveUsers(users: LocalUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

// 生成简单的用户ID
function generateUserId(): string {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 本地注册（无需密码验证，仅用于多账号隔离）
export function localRegister(email: string, username: string): LocalUser {
  const users = getAllUsers()
  
  // 检查邮箱是否已存在
  if (users.some(u => u.email === email)) {
    throw new Error('该邮箱已被注册')
  }
  
  // 检查用户名是否已存在
  if (users.some(u => u.username === username)) {
    throw new Error('该用户名已被使用')
  }
  
  // 创建新用户
  const newUser: LocalUser = {
    id: generateUserId(),
    email,
    username,
    brandSettings: {
      logo: null,
      qrcode: null,
      dividers: [],
      brandColors: ['#1e6fff', '#333333', '#666666'],
      customCSS: ''
    },
    preferences: {
      theme: 'light',
      autoSave: true,
      defaultTemplate: 'simple-doc'
    },
    createdAt: new Date().toISOString()
  }
  
  users.push(newUser)
  saveUsers(users)
  
  return newUser
}

// 本地登录（仅通过邮箱识别，无密码）
export function localLogin(email: string): LocalUser {
  const users = getAllUsers()
  const user = users.find(u => u.email === email)
  
  if (!user) {
    throw new Error('用户不存在，请先注册')
  }
  
  // 设置为当前用户
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  localStorage.setItem('current_user', JSON.stringify(user)) // 兼容现有代码
  
  return user
}

// 获取当前登录用户
export function getCurrentLocalUser(): LocalUser | null {
  const data = localStorage.getItem(CURRENT_USER_KEY)
  return data ? JSON.parse(data) : null
}

// 更新用户信息
export function updateLocalUser(userId: string, updates: Partial<LocalUser>): LocalUser {
  const users = getAllUsers()
  const index = users.findIndex(u => u.id === userId)
  
  if (index === -1) {
    throw new Error('用户不存在')
  }
  
  const updatedUser = {
    ...users[index],
    ...updates,
    id: users[index].id, // 确保ID不被覆盖
    createdAt: users[index].createdAt // 确保创建时间不被覆盖
  }
  
  users[index] = updatedUser
  saveUsers(users)
  
  // 如果是当前用户，更新当前用户信息
  const currentUser = getCurrentLocalUser()
  if (currentUser && currentUser.id === userId) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))
    localStorage.setItem('current_user', JSON.stringify(updatedUser))
  }
  
  return updatedUser
}

// 登出
export function localLogout() {
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem('current_user')
}

// 检查是否已登录
export function isLocalLoggedIn(): boolean {
  return getCurrentLocalUser() !== null
}

// 删除用户（慎用 - 会删除该用户的所有数据）
export function deleteLocalUser(userId: string) {
  const users = getAllUsers()
  const filteredUsers = users.filter(u => u.id !== userId)
  saveUsers(filteredUsers)
  
  // 如果删除的是当前用户，退出登录
  const currentUser = getCurrentLocalUser()
  if (currentUser && currentUser.id === userId) {
    localLogout()
  }
}

// 获取用户统计信息
export function getLocalUserStats() {
  const users = getAllUsers()
  return {
    totalUsers: users.length,
    currentUser: getCurrentLocalUser()
  }
}



