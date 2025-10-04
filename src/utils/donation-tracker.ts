// 打赏追踪工具 - 记录使用次数和打赏状态

interface DonationStats {
  totalUses: number
  firstUseDate: string
  lastUseDate: string
  lastPromptDate: string | null
  hasDonated: boolean
  donationDate: string | null
  neverShowAgain: boolean
}

const STATS_KEY = 'app_donation_stats'

// 获取统计数据
export function getDonationStats(): DonationStats {
  try {
    const saved = localStorage.getItem(STATS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('读取打赏统计失败:', error)
  }

  // 默认数据
  return {
    totalUses: 0,
    firstUseDate: new Date().toISOString(),
    lastUseDate: new Date().toISOString(),
    lastPromptDate: null,
    hasDonated: false,
    donationDate: null,
    neverShowAgain: false
  }
}

// 保存统计数据
function saveDonationStats(stats: DonationStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error('保存打赏统计失败:', error)
  }
}

// 增加使用次数
export function incrementUsageCount() {
  const stats = getDonationStats()
  stats.totalUses += 1
  stats.lastUseDate = new Date().toISOString()
  saveDonationStats(stats)
}

// 记录已打赏
export function markAsDonated() {
  const stats = getDonationStats()
  stats.hasDonated = true
  stats.donationDate = new Date().toISOString()
  saveDonationStats(stats)
}

// 记录提示时间
export function markPromptShown() {
  const stats = getDonationStats()
  stats.lastPromptDate = new Date().toISOString()
  saveDonationStats(stats)
}

// 设置不再提示
export function setNeverShowAgain() {
  const stats = getDonationStats()
  stats.neverShowAgain = true
  saveDonationStats(stats)
}

// 计算天数差
function getDaysDiff(dateString: string | null): number {
  if (!dateString) return Infinity
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// 判断是否应该显示打赏提示
export function shouldShowDonationPrompt(): boolean {
  const stats = getDonationStats()

  // 已打赏或选择不再提示
  if (stats.hasDonated || stats.neverShowAgain) {
    return false
  }

  // 第3次使用
  if (stats.totalUses === 3) {
    return true
  }

  // 第10次使用
  if (stats.totalUses === 10) {
    return true
  }

  // 第25次使用
  if (stats.totalUses === 25) {
    return true
  }

  // 使用超过10次，且距离上次提示超过14天
  if (stats.totalUses > 10) {
    const daysSinceLastPrompt = getDaysDiff(stats.lastPromptDate)
    if (daysSinceLastPrompt >= 14) {
      return true
    }
  }

  return false
}

// 获取提示文案
export function getDonationPromptMessage(stats: DonationStats): string {
  if (stats.totalUses === 3) {
    return '您已经使用了3次了！如果觉得好用，可以请作者喝杯咖啡 ☕'
  }
  if (stats.totalUses === 10) {
    return '哇！您已经使用了10次了 🎉\n如果这个工具帮到了您，考虑支持一下作者吧'
  }
  if (stats.totalUses === 25) {
    return '感谢您的持续使用！已经25次了 🙏\n一杯咖啡的支持，对作者意义重大'
  }
  return '如果这个工具对您有帮助，可以请作者喝杯咖啡 ☕'
}

