import { Template } from '../types/template'

// 科技风模板 - 现代、动感、适合产品发布
export const techModernTemplate: Template = {
  id: 'tech-modern',
  name: '科技现代',
  description: '适合科技产品、创新项目、技术分享',
  brandColors: ['#00d4ff', '#7c3aed', '#ec4899'],  // 预设配色：科技蓝紫
  usage: `
## 模板使用说明

### Markdown 语法对应关系：
- **# 大标题** → 文章主标题（居中，26px，渐变色）
- **## 章节标题** → 各个章节的标题（左对齐，22px，带底部装饰线）
- **### 小标题** → 小节标题（左对齐，19px，带左侧装饰）
- **普通文字** → 正文内容（16px，行高1.8）
- **[链接](地址)** → 科技蓝链接，hover效果
- **![图片](地址)** → 居中显示，带阴影效果
- **> 引用** → 左侧彩色边线的引用块，带背景渐变
- **- 列表项** → 带图标的无序列表
- **1. 列表项** → 带数字圆形标记的有序列表
- **\`代码\`** → 行内代码，深色背景

### 变量设置：
- **文章标题**: 会显示在文章顶部（自动从第一个#标题获取）
- **作者**: 显示在标题下方的署名
- **日期**: 显示发布或编写日期
- **LOGO**: 品牌标识，显示在文章顶部
- **二维码**: 文章底部的关注二维码
- **分割线**: 装饰性分割元素

### 适用场景：
- 科技产品发布
- 技术教程分享
- 创新项目介绍
- AI/数字化主题文章
  `,
  thumbnail: '/assets/thumbnails/tech-modern.png',
  category: 'document',
  
  styles: {
    // 容器样式
    container: {
      maxWidth: '100%',
      padding: '24px 20px',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "SF Pro Display", sans-serif',
      lineHeight: '1.8',
      textAlign: 'left'
    },
    
    // 字体排版
    typography: {
      // 主标题 - 渐变效果
      h1: {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: '28px',
        textAlign: 'center',
        lineHeight: '1.2',
        background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
        // WebkitBackgroundClip: 'text',
        // WebkitTextFillColor: 'transparent'
      },
      
      // 二级标题 - 带装饰线
      h2: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#000000',
        margin: '36px 0 18px 0',
        lineHeight: '1.3',
        borderBottom: '3px solid #00d4ff',
        paddingBottom: '10px'
      },
      
      // 三级标题 - 带左侧装饰
      h3: {
        fontSize: '19px',
        fontWeight: '600',
        color: '#1a1a1a',
        margin: '28px 0 14px 0',
        lineHeight: '1.4',
        paddingLeft: '16px',
        borderLeft: '4px solid #7c3aed'
      },
      
      // 正文段落
      p: {
        fontSize: '16px',
        color: '#333333',
        marginBottom: '18px',
        lineHeight: '1.8',
        textAlign: 'left'
      },
      
      // 链接样式
      a: {
        fontSize: '16px',
        color: '#00d4ff',
        textDecoration: 'none',
        fontWeight: '500',
        borderBottom: '1px solid rgba(0, 212, 255, 0.3)'
      },
      
      // 加粗文本
      strong: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#000000',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
        padding: '2px 6px',
        borderRadius: '3px'
      },
      
      // 斜体文本
      em: {
        fontSize: '16px',
        fontStyle: 'italic',
        color: '#7c3aed'
      },
      
      // 行内代码
      code: {
        backgroundColor: '#1a1a2e',
        color: '#00d4ff',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: '"Fira Code", "SF Mono", Monaco, Menlo, monospace'
      },
      
      // 引用块 - 带渐变背景
      blockquote: {
        fontSize: '16px',
        borderLeft: '4px solid #7c3aed',
        paddingLeft: '20px',
        margin: '24px 0',
        color: '#555555',
        fontStyle: 'italic',
        backgroundColor: 'rgba(124, 58, 237, 0.03)',
        padding: '16px 20px',
        borderRadius: '0 6px 6px 0'
      }
    },
    
    // 其他元素
    elements: {
      // 无序列表
      ul: {
        paddingLeft: '24px',
        marginBottom: '18px',
        listStyle: 'none'
      },
      
      // 有序列表
      ol: {
        paddingLeft: '24px', 
        marginBottom: '18px',
        listStyle: 'none'
      },
      
      // 列表项
      li: {
        marginBottom: '10px',
        lineHeight: '1.8',
        fontSize: '16px',
        color: '#333333',
        paddingLeft: '8px'
      },
      
      // 图片 - 带阴影
      img: {
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        display: 'block'
      },
      
      // 分割线 - 渐变效果
      hr: {
        border: 'none',
        height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, #00d4ff 50%, transparent 100%)',
        margin: '40px 0'
      }
    }
  },
  
  // 固定元素配置
  fixedElements: {
    footer: {
      template: ``,
      position: 'after',
      variables: {}
    }
  }
}

