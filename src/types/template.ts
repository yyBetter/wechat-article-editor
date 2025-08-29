// 模板类型定义
export interface Template {
  id: string
  name: string
  description: string
  usage?: string
  thumbnail: string
  category: 'document' | 'image-text' | 'custom'
  
  // 样式配置
  styles: {
    container: TemplateContainerStyle
    typography: TemplateTypography
    elements?: TemplateElements
    imageBlock?: ImageBlockStyle
  }
  
  // 固定元素插入配置
  fixedElements: {
    header?: FixedElementConfig
    footer?: FixedElementConfig
    dividers?: FixedElementConfig[]
  }
}

// 容器样式
export interface TemplateContainerStyle {
  maxWidth: string
  padding: string
  backgroundColor: string
  fontFamily: string
  lineHeight?: string
  textAlign?: 'left' | 'center' | 'right'
}

// 字体排版样式
export interface TemplateTypography {
  h1: TextStyle
  h2: TextStyle
  h3: TextStyle
  p: TextStyle
  a: TextStyle
  strong?: TextStyle
  em?: TextStyle
  code?: TextStyle
  blockquote?: TextStyle
}

// 文本样式
export interface TextStyle {
  fontSize: string
  fontWeight?: string | number
  color: string
  lineHeight?: string
  margin?: string
  marginBottom?: string
  marginTop?: string
  textAlign?: 'left' | 'center' | 'right'
  textDecoration?: string
  fontStyle?: string
  backgroundColor?: string
  padding?: string
  borderRadius?: string
  border?: string
  borderLeft?: string
  paddingLeft?: string
}

// 其他元素样式
export interface TemplateElements {
  ul?: ListStyle
  ol?: ListStyle
  li?: TextStyle
  img?: ImageStyle
  hr?: DividerStyle
}

// 列表样式
export interface ListStyle {
  paddingLeft: string
  marginBottom: string
  listStyle?: string
}

// 图片样式
export interface ImageStyle {
  width: string
  height?: string
  marginBottom: string
  borderRadius?: string
  boxShadow?: string
}

// 分割线样式
export interface DividerStyle {
  border: string
  margin: string
  height?: string
  backgroundColor?: string
}

// 图文块样式
export interface ImageBlockStyle {
  container: {
    marginBottom: string
  }
  image: ImageStyle
  title: TextStyle
  description: TextStyle
}

// 固定元素配置
export interface FixedElementConfig {
  template: string
  position: 'before' | 'after'
  variables: Record<string, string>
}

// 模板变量
export interface TemplateVariables {
  title?: string
  content: string
  author?: string
  date?: string
  logo?: string
  qrcode?: string
  divider?: string
  [key: string]: string | undefined
}