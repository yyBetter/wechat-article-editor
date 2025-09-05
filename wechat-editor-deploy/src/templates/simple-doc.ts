import { Template } from '../types/template'

// 简约文档型模板 - 基于第一张参考图片
export const simpleDocTemplate: Template = {
  id: 'simple-doc',
  name: '简约文档',
  description: '适合文字内容、资讯、技术文档等',
  usage: `
## 模板使用说明

### Markdown 语法对应关系：
- **# 大标题** → 文章主标题（居中，24px）
- **## 章节标题** → 各个章节的标题（左对齐，20px，加粗）
- **### 小标题** → 小节标题（左对齐，18px）
- **普通文字** → 正文内容（17px，行高1.75）
- **[链接](地址)** → 蓝色链接
- **![图片](地址)** → 居中显示的图片
- **> 引用** → 左侧带边线的引用块
- **- 列表项** → 无序列表
- **1. 列表项** → 有序列表
- **\`代码\`** → 行内代码
- **粗体文字** → **粗体显示**

### 变量设置：
- **文章标题**: 会显示在文章顶部（自动从第一个#标题获取）
- **作者**: 显示在标题下方的署名
- **日期**: 显示发布或编写日期
- **LOGO**: 品牌标识，显示在文章顶部
- **二维码**: 文章底部的关注二维码
- **分割线**: 装饰性分割元素
  `,
  thumbnail: '/assets/thumbnails/simple-doc.png',
  category: 'document',
  
  styles: {
    // 容器样式
    container: {
      maxWidth: '100%',
      padding: '20px 16px',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      lineHeight: '1.6',
      textAlign: 'left'
    },
    
    // 字体排版
    typography: {
      // 主标题
      h1: {
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: '24px',
        textAlign: 'center',
        lineHeight: '1.3'
      },
      
      // 二级标题  
      h2: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#000000',
        margin: '32px 0 16px 0',
        lineHeight: '1.4'
      },
      
      // 三级标题
      h3: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333333',
        margin: '24px 0 12px 0',
        lineHeight: '1.4'
      },
      
      // 正文段落
      p: {
        fontSize: '15px',
        color: '#333333',
        marginBottom: '16px',
        lineHeight: '1.7',
        textAlign: 'left'
      },
      
      // 链接样式
      a: {
        fontSize: '15px',
        color: '#1e6fff', // 这会被品牌主色替换
        textDecoration: 'underline',
        fontWeight: 'normal'
      },
      
      // 加粗文本
      strong: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#000000'
      },
      
      // 斜体文本
      em: {
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#666666'
      },
      
      // 行内代码
      code: {
        backgroundColor: '#f5f5f5',
        color: '#d73a49',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '14px'
      },
      
      // 引用块
      blockquote: {
        fontSize: '15px',
        borderLeft: '3px solid #e1e4e8',
        paddingLeft: '16px',
        margin: '20px 0',
        color: '#666666',
        fontStyle: 'italic',
        backgroundColor: '#f9f9f9',
        padding: '12px 16px',
        borderRadius: '0 4px 4px 0'
      }
    },
    
    // 其他元素
    elements: {
      // 无序列表
      ul: {
        paddingLeft: '20px',
        marginBottom: '16px',
        listStyle: 'disc'
      },
      
      // 有序列表
      ol: {
        paddingLeft: '20px', 
        marginBottom: '16px',
        listStyle: 'decimal'
      },
      
      // 列表项
      li: {
        marginBottom: '8px',
        lineHeight: '1.6',
        fontSize: '15px',
        color: '#333333'
      },
      
      // 图片
      img: {
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        marginBottom: '16px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'block'
      },
      
      // 分割线
      hr: {
        border: 'none',
        height: '1px',
        backgroundColor: '#e1e4e8',
        margin: '32px 0'
      }
    }
  },
  
  // 固定元素配置
  fixedElements: {
    // 文章尾部 - 暂时禁用，等待后续配置
    footer: {
      template: ``,
      position: 'after',
      variables: {}
    }
  }
}