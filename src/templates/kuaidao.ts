import { Template } from '../types/template'

// 快刀墨韵模板 - 仿快刀青衣风格
export const kuaidaoTemplate: Template = {
    id: 'kuaidao',
    name: '快刀墨韵',
    description: '仿快刀青衣风格，极致阅读体验，突出数字章节',
    brandColors: ['#0052FF', '#3E3E3E', '#F5F5F5'],
    usage: `
## 模板使用说明

### 样式特点：
- **全文居中对齐的章节标题**：带有醒目的蓝色底边线
- **极致阅读体验**：优化的行高和字间距，正文使用淡黑色 (#3E3E3E)
- **重点突出**：加粗文字自动使用蓝色 (#0052FF) 强调

### 元素对应：
- **# 一级标题** → 文章主标题（居中，22px）
- **## 二级标题** → 章节标题（居中，24px，蓝色底边线，推荐带数字如 01、02）
- **### 三级标题** → 小节标题（左对齐，18px）
- **正文** → 16px，1.75倍行高，两端对齐
- **图片** → 自动居中显示
  `,
    thumbnail: '/assets/thumbnails/kuaidao.png',
    category: 'document',

    styles: {
        container: {
            maxWidth: '100%',
            padding: '24px 20px',
            backgroundColor: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, system-ui, Helvetica Neue, sans-serif',
            lineHeight: '1.6',
            textAlign: 'left'
        },

        typography: {
            h1: {
                fontSize: '22px',
                fontWeight: '500',
                color: 'rgba(0, 0, 0, 0.9)',
                marginBottom: '20px',
                textAlign: 'center',
                lineHeight: '1.4'
            },

            h2: {
                fontSize: '24px',
                fontWeight: '700',
                color: '#000000',
                margin: '40px auto 24px',
                textAlign: 'center',
                lineHeight: '1.2',
                borderBottom: '4px solid #0066FF',
                paddingBottom: '8px',
                display: 'table'
            },

            h3: {
                fontSize: '18px',
                fontWeight: '600',
                color: '#222222',
                margin: '24px 0 16px 0',
                lineHeight: '1.4'
            },

            p: {
                fontSize: '16px',
                color: '#3E3E3E',
                marginBottom: '20px',
                lineHeight: '1.6',
                textAlign: 'justify'
            },

            a: {
                fontSize: '16px',
                color: '#0052FF',
                textDecoration: 'none',
                fontWeight: '500'
            },

            strong: {
                fontSize: '16px',
                fontWeight: '600',
                color: '#0052FF'
            },

            em: {
                fontSize: '16px',
                fontStyle: 'italic',
                color: '#666666'
            },

            code: {
                backgroundColor: '#f6f6f6',
                color: '#3E3E3E',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace'
            },

            blockquote: {
                fontSize: '16px',
                borderLeft: '4px solid #0052FF',
                padding: '12px 16px',
                margin: '24px 0',
                color: '#666666',
                backgroundColor: '#F8FAFF'
            }
        },
        elements: {
            ul: {
                paddingLeft: '24px',
                marginBottom: '20px',
                listStyle: 'disc'
            },
            ol: {
                paddingLeft: '24px',
                marginBottom: '20px',
                listStyle: 'decimal'
            },
            li: {
                marginBottom: '10px',
                lineHeight: '1.6',
                fontSize: '16px',
                color: '#3E3E3E'
            },
            img: {
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                marginBottom: '24px',
                borderRadius: '8px',
                display: 'block',
                margin: '0 auto'
            },
            hr: {
                border: 'none',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #0052FF, transparent)',
                margin: '40px 0',
                opacity: 0.3
            },
            table: {
                width: '100%',
                marginBottom: '24px',
                borderCollapse: 'collapse',
                fontSize: '15px',
                color: '#3E3E3E'
            },
            th: {
                fontSize: '15px',
                color: '#ffffff',
                backgroundColor: '#0052FF',
                border: '1px solid #0052FF',
                padding: '10px',
                fontWeight: '600',
                textAlign: 'center'
            },
            td: {
                fontSize: '15px',
                color: '#3E3E3E',
                border: '1px solid #e0e0e0',
                padding: '10px',
                textAlign: 'center'
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
