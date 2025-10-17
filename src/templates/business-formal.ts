import { Template } from '../types/template'

// 商务正式模板 - 适合企业公告、正式文档
export const businessFormalTemplate: Template = {
  id: 'business-formal',
  name: '商务正式',
  description: '适合企业公告、商业报告、正式通知',
  brandColors: ['#2c5282', '#1a202c', '#718096'],  // 预设配色：商务蓝灰
  usage: `
## 模板使用说明

### Markdown 语法对应关系：
- **# 大标题** → 文章主标题（居中，24px，深色）
- **## 章节标题** → 各个章节的标题（左对齐，20px，带编号效果）
- **### 小标题** → 小节标题（左对齐，18px）
- **普通文字** → 正文内容（15px，行高1.75，两端对齐）
- **[链接](地址)** → 商务蓝链接
- **![图片](地址)** → 居中显示的图片
- **> 引用** → 带边框的引用块
- **- 列表项** → 无序列表
- **1. 列表项** → 有序列表
- **\`代码\`** → 行内代码

### 适用场景：
- 企业公告通知
- 商业计划书
- 年度报告总结
- 正式会议记录
  `,
  thumbnail: '/assets/thumbnails/business-formal.png',
  category: 'document',
  
  styles: {
    container: {
      maxWidth: '100%',
      padding: '24px 20px',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Georgia, serif',
      lineHeight: '1.75',
      textAlign: 'left'
    },
    
    typography: {
      h1: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: '32px',
        textAlign: 'center',
        lineHeight: '1.3',
        borderBottom: '2px solid #2c5282',
        paddingBottom: '16px'
      },
      
      h2: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#2c5282',
        margin: '32px 0 16px 0',
        lineHeight: '1.4'
      },
      
      h3: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a202c',
        margin: '24px 0 12px 0',
        lineHeight: '1.4'
      },
      
      p: {
        fontSize: '15px',
        color: '#333333',
        marginBottom: '16px',
        lineHeight: '1.75',
        textAlign: 'justify'
      },
      
      a: {
        fontSize: '15px',
        color: '#2c5282',
        textDecoration: 'underline',
        fontWeight: 'normal'
      },
      
      strong: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#1a202c'
      },
      
      em: {
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#4a5568'
      },
      
      code: {
        backgroundColor: '#f7fafc',
        color: '#2d3748',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '14px',
        border: '1px solid #e2e8f0'
      },
      
      blockquote: {
        fontSize: '15px',
        margin: '20px 0',
        color: '#4a5568',
        fontStyle: 'normal',
        backgroundColor: '#f7fafc',
        padding: '12px 16px 12px 20px',
        borderRadius: '0 4px 4px 0',
        border: '1px solid #e2e8f0',
        borderLeft: '4px solid #2c5282'
      }
    },
    
    elements: {
      ul: {
        paddingLeft: '28px',
        marginBottom: '16px',
        listStyle: 'disc'
      },
      
      ol: {
        paddingLeft: '28px', 
        marginBottom: '16px',
        listStyle: 'decimal'
      },
      
      li: {
        marginBottom: '8px',
        lineHeight: '1.75',
        fontSize: '15px',
        color: '#333333'
      },
      
      img: {
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '16px',
        borderRadius: '4px',
        border: '1px solid #e2e8f0',
        display: 'block'
      },
      
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#cbd5e0',
        margin: '32px 0'
      }
    }
  },
  
  fixedElements: {
    footer: {
      template: ``,
      position: 'after',
      variables: {}
    }
  }
}

