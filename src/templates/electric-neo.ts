import { Template } from '../types/template'

// 电讯风模板 - 高对比度、科技媒体风格
export const electricNeoTemplate: Template = {
    id: 'electric-neo',
    name: '电讯风',
    description: '电讯蓝与霓虹绿撞色，极简科技趋势，适合商业与科技深度点评',
    brandColors: ['#0034C6', '#A3FD00', '#000000'],
    usage: `
## 模板使用说明

### 样式特点：
- **电讯蓝 (#0034C6)**：作为主色，用于标题、数字和分割线
- **霓虹绿 (#A3FD00)**：作为强调色，用于边角点缀和“眉标”
- **大字号章节**：二级标题采用夸张的斜体数字标识
- **高对比科技感**：极简留白，突出文字力量感

### 元素对应：
- **# 一级标题** → 核心标题（带霓虹绿左上角装饰块）
- **## 二级标题** → 章节标识（大号斜体蓝色字体）
- **### 三级标题** → 小节标题（左对齐，带蓝底装饰）
- **加粗文字** → 自动变为电讯蓝 (#0034C6)
  `,
    thumbnail: '/assets/thumbnails/electric_neo.png',
    category: 'document',

    styles: {
        container: {
            maxWidth: '100%',
            padding: '40px 20px',
            backgroundColor: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.65',
            textAlign: 'left',
            color: 'rgba(0, 0, 0, 0.9)'
        },

        typography: {
            h1: {
                fontSize: '22px',
                fontWeight: '800',
                color: '#0034C6',
                margin: '20px 0 40px',
                textAlign: 'center',
                lineHeight: '1.3',
                padding: '12px',
                position: 'relative',
                letterSpacing: '0.54px'
            },

            h2: {
                fontSize: '26px',
                fontWeight: '900',
                color: '#0034C6',
                margin: '60px 0 20px',
                fontStyle: 'italic',
                textAlign: 'center',
                display: 'block',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '0.54px'
            },

            h3: {
                fontSize: '16px',
                fontWeight: '700',
                color: '#ffffff',
                backgroundColor: '#0034C6',
                padding: '6px 12px',
                margin: '30px 0 15px',
                display: 'inline-block',
                lineHeight: '1.4',
                letterSpacing: '0.54px'
            },

            p: {
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.9)',
                marginBottom: '24px',
                lineHeight: '1.65',
                textAlign: 'justify',
                letterSpacing: '0.54px'
            },

            strong: {
                fontSize: '16px',
                fontWeight: '700',
                color: '#0034C6',
                letterSpacing: '0.54px'
            },

            a: {
                fontSize: '16px',
                color: '#0034C6',
                textDecoration: 'none',
                borderBottom: '1px solid #A3FD00'
            },

            blockquote: {
                fontSize: '15px',
                padding: '20px',
                margin: '24px 0',
                color: '#333333',
                backgroundColor: '#f5f5f5',
                borderLeft: '4px solid #A3FD00',
                lineHeight: '1.6'
            }
        },
        elements: {
            ul: {
                paddingLeft: '20px',
                marginBottom: '24px',
                listStyle: 'none'
            },
            li: {
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.9)',
                marginBottom: '12px',
                position: 'relative',
                paddingLeft: '15px',
                lineHeight: '1.6',
                letterSpacing: '0.54px'
            },
            hr: {
                border: 'none',
                height: '4px',
                backgroundColor: '#0034C6',
                margin: '40px 0'
            },
            table: {
                width: '100%',
                marginBottom: '24px',
                borderCollapse: 'collapse',
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.9)',
                letterSpacing: '0.54px'
            },
            th: {
                fontSize: '15px',
                backgroundColor: '#0034C6',
                color: '#ffffff',
                border: '1px solid #0034C6',
                padding: '10px',
                fontWeight: '700',
                textAlign: 'center'
            },
            td: {
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid #e0e0e0',
                padding: '10px',
                textAlign: 'center'
            }
        }
    },

    fixedElements: {
        header: {
            template: `
        <style>
          #electric-neo h1::before {
            content: "";
            position: absolute;
            top: -5px;
            left: -5px;
            width: 20px;
            height: 20px;
            border-top: 4px solid #A3FD00;
            border-left: 4px solid #A3FD00;
          }
          #electric-neo li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 10px;
            width: 6px;
            height: 6px;
            background-color: #0034C6;
            transform: rotate(45deg);
          }
        </style>
      `,
            position: 'before',
            variables: {}
        }
    }
}
