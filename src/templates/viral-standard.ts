import { Template } from '../types/template'

// 爆款标准模板 - 基于10万+阅读黄金参数
export const viralTemplate: Template = {
  id: 'viral-standard',
  name: '爆款标准',
  description: '10万+阅读黄金参数，极致阅读体验，适合追求高打开率的内容',
  brandColors: ['#333333', '#666666', '#1e6fff'],
  usage: `
## 模板使用说明

### 黄金排版参数（10万+阅读都在用）

**留白与间距：**
- 页边距：14px（12-16px黄金区间）
- 段间距：18px（15-20px黄金区间）
- 行间距：1.75（1.5-1.75黄金区间）
- 字间距：0.5px（0.5-1px黄金区间）

**字体字号：**
- 正文：15px（14-16px黄金区间）
- 主标题：19px（18-20px黄金区间）
- 副标题：17px（16-18px黄金区间）
- 默认字体，不花里胡哨

**颜色搭配：**
- 全文不超过3种颜色
- 正文统一深灰 #333
- 重点用1种强调色 #1e6fff

### 排版核心原则
好的排版是透明的——读者不会注意到排版，但会因为舒服多停留几秒。

### 避坑指南
- ❌ 避免花哨排版
- ❌ 别用太多分割线
- ❌ 少用动画图片
- ❌ 慎用SVG元素
- ✅ 这些会拖累打开速度，影响系统推荐

### 适用场景
- 新闻资讯
- 干货教程
- 观点评论
- 产品推荐
- 任何追求高阅读完成率的内容
  `,
  thumbnail: '/assets/thumbnails/viral-standard.png',
  category: 'document',

  styles: {
    container: {
      maxWidth: '100%',
      padding: '14px',  // 黄金页边距
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      lineHeight: '1.75',  // 黄金行间距
      textAlign: 'left',
      color: '#333333'
    },

    typography: {
      h1: {
        fontSize: '19px',  // 黄金主标题
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: '20px',
        textAlign: 'center',
        lineHeight: '1.4'
      },

      h2: {
        fontSize: '17px',  // 黄金副标题
        fontWeight: '600',
        color: '#000000',
        margin: '32px 0 16px 0',
        lineHeight: '1.4',
        borderLeft: '3px solid #1e6fff',  // 强调色点缀
        paddingLeft: '12px'
      },

      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333333',
        margin: '24px 0 12px 0',
        lineHeight: '1.4'
      },

      p: {
        fontSize: '15px',  // 黄金正文
        color: '#333333',
        marginBottom: '18px',  // 黄金段间距
        lineHeight: '1.75',  // 黄金行间距
        textAlign: 'justify',
        letterSpacing: '0.5px'  // 黄金字间距
      },

      a: {
        fontSize: '15px',
        color: '#1e6fff',  // 强调色
        textDecoration: 'underline',
        fontWeight: 'normal'
      },

      strong: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#1e6fff'  // 强调色突出重点
      },

      em: {
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#666666'
      },

      code: {
        backgroundColor: '#f5f5f5',
        color: '#d73a49',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '14px',
        fontFamily: 'SFMono-Regular, Consolas, monospace'
      },

      blockquote: {
        fontSize: '15px',
        borderLeft: '3px solid #1e6fff',  // 强调色
        padding: '12px 16px',
        margin: '24px 0',
        color: '#666666',
        fontStyle: 'italic',
        backgroundColor: '#f9f9f9',
        borderRadius: '0 4px 4px 0',
        lineHeight: '1.75'
      }
    },

    elements: {
      ul: {
        paddingLeft: '20px',
        marginBottom: '18px',
        listStyle: 'disc'
      },

      ol: {
        paddingLeft: '20px',
        marginBottom: '18px',
        listStyle: 'decimal'
      },

      li: {
        marginBottom: '10px',
        lineHeight: '1.75',
        fontSize: '15px',
        color: '#333333',
        letterSpacing: '0.5px'
      },

      img: {
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '18px',
        borderRadius: '4px',
        display: 'block'
      },

      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#e1e4e8',
        margin: '32px 0'
      },

      table: {
        width: '100%',
        marginBottom: '24px',
        borderCollapse: 'collapse',
        fontSize: '14px',
        color: '#333333'
      },

      th: {
        fontSize: '14px',
        color: '#000000',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        padding: '10px',
        fontWeight: '600',
        textAlign: 'center'
      },

      td: {
        fontSize: '14px',
        color: '#333333',
        border: '1px solid #dee2e6',
        padding: '10px',
        textAlign: 'center'
      }
    }
  },

  fixedElements: {
    footer: {
      template: '',
      position: 'after',
      variables: {}
    }
  }
}
