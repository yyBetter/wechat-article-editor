import { Template } from '../types/template'

// 青韵简报模板 - 仿分析报告/手绘风格
export const blueprintReportTemplate: Template = {
    id: 'report-grid',
    name: '青韵简报',
    description: '深青色系分析报告风格，带有稿纸方格底纹和手绘动效感',
    brandColors: ['#075757', '#a52a2a', '#3e3e3e'],
    usage: `
## 模板使用说明

### 样式特点：
- **稿纸方格底纹**：全文背景采用浅青色网格，模拟分析报告质感
- **深青色主色调**：用于一级标题边框、重点加粗文字
- **枣红色点缀**：用于二级标题图标，突出层级

### 元素对应：
- **# 一级标题** → 单元大标题（居中，深青色虚线框）
- **## 二级标题** → 章节标题（左对齐，带枣红色圆形图标）
- **### 三级标题** → 重点强调（深青色加粗文字）
- **加粗文字** → 自动使用深青色 (#075757) 强调
  `,
    thumbnail: '/assets/thumbnails/report_grid.png',
    category: 'document',

    styles: {
        container: {
            maxWidth: '100%',
            padding: '40px 20px',
            backgroundColor: '#ffffff',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, #f0f7f7 24px, #f0f7f7 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, #f0f7f7 24px, #f0f7f7 25px)',
            backgroundSize: '25px 25px',
            fontFamily: 'PingFang SC, -apple-system, system-ui, sans-serif',
            lineHeight: '1.6',
            color: 'rgba(0, 0, 0, 0.9)'
        },

        typography: {
            h1: {
                fontSize: '20px',
                fontWeight: '700',
                color: '#075757',
                margin: '20px auto 40px',
                textAlign: 'center',
                padding: '10px 20px',
                border: '1px dashed #075757',
                display: 'table',
                lineHeight: '1.4',
                position: 'relative',
                letterSpacing: '0.54px'
            },

            h2: {
                fontSize: '17px',
                fontWeight: '700',
                color: '#a52a2a',
                margin: '40px 0 20px 0',
                paddingLeft: '28px',
                position: 'relative',
                display: 'block',
                lineHeight: '1.5',
                letterSpacing: '0.54px'
            },

            h3: {
                fontSize: '15px',
                fontWeight: '700',
                color: '#075757',
                margin: '30px 0 15px 0',
                lineHeight: '1.4',
                letterSpacing: '0.54px'
            },

            p: {
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.9)',
                marginBottom: '24px',
                lineHeight: '1.6',
                textAlign: 'justify',
                letterSpacing: '0.54px'
            },

            a: {
                fontSize: '15px',
                color: '#075757',
                textDecoration: 'underline'
            },

            strong: {
                fontSize: '15px',
                color: '#075757',
                fontWeight: '700',
                letterSpacing: '0.54px'
            },

            blockquote: {
                fontSize: '14px',
                borderLeft: '4px solid #075757',
                padding: '12px 20px',
                margin: '24px 0',
                color: '#666666',
                backgroundColor: 'rgba(7, 87, 87, 0.03)',
                fontStyle: 'italic',
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
                fontSize: '15px',
                color: 'rgba(0, 0, 0, 0.9)',
                marginBottom: '10px',
                position: 'relative',
                paddingLeft: '15px',
                lineHeight: '1.6',
                letterSpacing: '0.54px'
            }
        }
    },

    fixedElements: {
        header: {
            template: `
        <style>
          #report-grid h2::before {
            content: " ";
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            background-color: #a52a2a;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 0 1px #a52a2a;
          }
        </style>
      `,
            position: 'before',
            variables: {}
        }
    }
}
