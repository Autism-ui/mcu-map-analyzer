# MCU Map 文件分析工具

一个基于 Web 的 MCU map 文件分析工具，支持上传 GCC 编译器生成的 map 文件，并通过图形化界面展示内存使用情况。

## 功能特性

- 📊 内存分布可视化（Flash/RAM 使用情况）
- 📈 函数大小排名分析
- 📦 模块级别内存占用统计
- 🔍 符号详细列表（支持搜索、排序、分页）
- 💾 导出分析结果（JSON/CSV 格式）
- 🎨 响应式设计，支持移动端

## 技术栈

- React 18 + TypeScript
- Vite
- ECharts
- Tailwind CSS

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

1. 打开应用
2. 拖拽或点击上传 GCC 生成的 .map 文件
3. 查看各种分析图表和数据
4. 可选：导出分析结果

## 部署

本项目已配置好部署文件，可以一键部署到以下平台：

### Vercel（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

或使用命令行：

```bash
npm install -g vercel
vercel
```

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

或使用命令行：

```bash
npm run build
# 将 dist 目录部署到 Netlify
```

### 手动部署

1. 运行 `npm run build` 构建项目
2. 将 `dist` 目录部署到任何静态网站托管服务
3. 确保配置 SPA 路由重定向到 `index.html`

## 许可证

MIT
