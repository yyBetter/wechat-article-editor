import { Template } from '../types/template'

// 液态玻璃模板 - Apple 设计美学，磨砂玻璃感
export const liquidGlassTemplate: Template = {
    id: 'liquid-glass',
    name: '液态玻璃',
    description: '精致 Apple 磨砂风格，柔和流体渐变与半透明卡片设计',
    brandColors: ['#0071e3', '#bf5af2', '#f5f5f7'],
    usage: `
## 模板使用说明

### 样式特点：
- **玻璃感标题**：采用半透明渐变背景与柔和阴影模拟磨砂玻璃效果
- **流体分界**：背景使用极淡的蓝紫流体渐变，营造空间感
- **极致圆润**：所有容器和修饰块均采用 16px+ 大圆角
- **呼吸感排版**：行高 1.7，字间距 0.6px，阅读清爽

### 元素对应：
- **# 一级标题** → 玻璃卡片标题（带柔和内发光）
- **## 二级标题** → 胶囊进度章（居中，带淡色背板）
- **### 三级标题** → 重点标注（左侧带圆润彩色装饰条）
- **加粗文字** → Apple 蓝色 (#0071e3) 强调
  `,
    thumbnail: '/assets/thumbnails/liquid_glass.png',
    category: 'document',

    styles: {
        container: {
            maxWidth: '100%',
            padding: '40px 20px',
            backgroundColor: '#f5f5f7',
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(0, 113, 227, 0.03) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(191, 90, 242, 0.03) 0, transparent 50%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
            lineHeight: '1.7',
            color: 'rgba(0, 0, 0, 0.9)'
        },

        typography: {
            h1: {
                fontSize: '24px',
                fontWeight: '700',
                color: '#1d1d1f',
                margin: '20px auto 40px',
                textAlign: 'center',
                padding: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
                display: 'table',
                lineHeight: '1.3',
                letterSpacing: '0.6px',
                position: 'relative'
            },

            h2: {
                fontSize: '18px',
                fontWeight: '600',
                color: '#0071e3',
                margin: '40px auto 20px',
                padding: '8px 24px',
                backgroundColor: 'rgba(0, 113, 227, 0.08)',
                borderRadius: '50px',
                display: 'table',
                textAlign: 'center',
                lineHeight: '1.4',
                letterSpacing: '0.6px'
            },

            h3: {
                fontSize: '17px',
                fontWeight: '700',
                color: '#1d1d1f',
                margin: '30px 0 15px',
                paddingLeft: '16px',
                borderLeft: '4px solid #0071e3',
                lineHeight: '1.4',
                letterSpacing: '0.6px'
            },

            p: {
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.85)',
                marginBottom: '26px',
                lineHeight: '1.7',
                textAlign: 'justify',
                letterSpacing: '0.6px'
            },

            strong: {
                fontSize: '16px',
                color: '#0071e3',
                fontWeight: '700',
                letterSpacing: '0.6px'
            },

            a: {
                fontSize: '16px',
                color: '#0071e3',
                textDecoration: 'none',
                borderBottom: '1.5px solid rgba(0, 113, 227, 0.3)'
            },

            blockquote: {
                fontSize: '16px',
                padding: '24px',
                margin: '32px 0',
                color: 'rgba(0, 0, 0, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '20px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                lineHeight: '1.7',
                fontStyle: 'normal',
                position: 'relative'
            }
        },
        elements: {
            ul: {
                paddingLeft: '20px',
                marginBottom: '26px',
                listStyle: 'none'
            },
            li: {
                fontSize: '16px',
                color: 'rgba(0, 0, 0, 0.85)',
                marginBottom: '12px',
                position: 'relative',
                paddingLeft: '18px',
                lineHeight: '1.7',
                letterSpacing: '0.6px'
            },
            table: {
                width: '100%',
                marginBottom: '26px',
                borderCollapse: 'separate',
                borderSpacing: '0',
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.85)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
            },
            th: {
                fontSize: '15px',
                color: '#0071e3',
                backgroundColor: 'rgba(0, 113, 227, 0.05)',
                padding: '12px',
                fontWeight: '600',
                textAlign: 'left',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
            },
            td: {
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.85)',
                padding: '12px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
            }
        }
    },

    fixedElements: {
        header: {
            template: `
        <style>
          #liquid-glass li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 10px;
            width: 6px;
            height: 6px;
            background-color: #bf5af2;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(191, 90, 242, 0.4);
          }
          #liquid-glass blockquote::after {
            content: "“";
            position: absolute;
            top: 10px;
            left: 20px;
            font-size: 40px;
            color: rgba(0, 113, 227, 0.1);
            font-family: serif;
          }
        </style>
      `,
            position: 'before',
            variables: {}
        }
    }
}
