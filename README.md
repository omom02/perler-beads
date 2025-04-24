# 拼豆底稿生成器
> Perler Beads Generator (Palette Mapping Edition)

一个基于 Web 的工具，可以将普通图片转换为适配Mard特定调色板（拼豆颜色）的像素画图纸。用户可以上传图片，调整像素化粒度，预览效果，并下载带有颜色编码的网格图纸和对应的 JSON 数据。

## 功能特点

*   **图片上传**: 支持拖放或点击选择 JPG/PNG 图片。
*   **可调粒度**: 通过滑块控制像素化的精细程度（网格宽度）。
*   **颜色映射**: 将图像颜色自动映射到预定义的拼豆调色板。
*   **实时预览**: 在网页上即时显示映射后的像素画预览（带网格线，无颜色编码）。
*   **带 Key 图纸下载**: 下载带有颜色编码（Key）和网格线的清晰 PNG 图纸。
*   **JSON 数据下载**: 下载包含每个格子对应颜色编码的二维数组 JSON 文件。

## 技术实现

*   **框架**: [Next.js](https://nextjs.org/) (React) 与 TypeScript
*   **样式**: [Tailwind CSS](https://tailwindcss.com/) 用于响应式布局和样式。
*   **核心逻辑**: 浏览器端 [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 用于图像处理和绘制。

### 核心算法：像素化与颜色映射

应用程序的核心在于将任意图像颜色精确映射到有限的拼豆调色板上。主要步骤如下：

1.  **图像加载与预处理**:
    *   用户上传图片后，使用 `FileReader` 将其读取为 Data URL。
    *   创建一个 `Image` 对象加载该 URL。

2.  **网格划分**:
    *   根据用户选择的"精细度"(`granularity`) 确定像素画在宽度方向上的格子数量 `N`。
    *   根据原图的宽高比计算高度方向的格子数量 `M = round(N * height / width)`，确保 `M` 至少为 1。

3.  **平均颜色计算**:
    *   在内存中创建一个隐藏的 Canvas (`originalCanvasRef`)，并绘制原始图片。
    *   遍历 `N x M` 网格中的每一个单元格。
    *   对于每个单元格，计算其在原图上对应的像素区域。
    *   使用 `originalCtx.getImageData()` 获取该区域内所有像素的 RGBA 数据。
    *   计算该区域内所有**不完全透明**（例如，Alpha > 128）像素的**平均 RGB 值**。忽略 Alpha 值本身用于颜色距离计算，只关注颜色本身。如果单元格内所有像素都透明，则将其视为默认颜色（如白色 T1）。

4.  **颜色映射 (关键步骤)**:
    *   **调色板**: 项目代码中预先定义了一个 `beadPalette` 数组，包含每个拼豆颜色的 Key (如 "H7")、Hex 值 (如 "#000000") 和预计算的 RGB 值。
    *   **查找最近色**: 对于上一步计算出的每个单元格的平均 RGB 值 (`avgRgb`)，调用 `findClosestPaletteColor` 函数。
    *   **距离度量**: 该函数遍历 `beadPalette` 中的所有颜色，使用**欧氏距离**计算 `avgRgb` 与调色板中每个颜色 RGB 值之间的距离：
        \[ d = \sqrt{(R_{avg}-R_{palette})^2 + (G_{avg}-G_{palette})^2 + (B_{avg}-B_{palette})^2} \]
    *   **匹配**: 选择欧氏距离最小的那个调色板颜色作为该单元格的最终映射结果。
    *   **存储结果**: 将每个单元格匹配到的拼豆 Key 和 Hex 颜色存储在一个二维数组状态 `mappedPixelData` 中。

5.  **生成预览图**:
    *   获取页面上可见的 Canvas (`pixelatedCanvasRef`) 的上下文 `pixelatedCtx`。
    *   遍历 `mappedPixelData`。
    *   对于每个单元格，使用其**映射后的拼豆颜色** (`mappedPixelData[j][i].color`) 填充对应的矩形区域。
    *   在每个填充的色块上绘制**浅灰色细边框**，形成网格线效果。
    *   **注意**: 预览图上不绘制颜色 Key，仅显示颜色和网格。

6.  **生成带 Key 的下载图纸 (`handleDownloadImage`)**:
    *   用户点击"下载图纸 (带 Key)"按钮时触发。
    *   动态创建**新的、临时的 Canvas** (`downloadCanvas`)。
    *   定义一个固定的单元格渲染尺寸 `downloadCellSize`（例如 30 像素），确保足够容纳文字。
    *   设置 `downloadCanvas` 的尺寸为 `(N * downloadCellSize) x (M * downloadCellSize)`。
    *   获取其上下文 `ctx` 并设置 `ctx.imageSmoothingEnabled = false` 以保证像素块和文字的清晰度。
    *   遍历 `mappedPixelData`：
        *   使用**映射后的拼豆颜色**填充 `downloadCellSize x downloadCellSize` 的背景矩形。
        *   绘制**灰色细边框**。
        *   使用 `getContrastColor` 函数（基于亮度计算）选择与背景色对比度高的文字颜色（黑色或白色）。
        *   在单元格中央绘制对应的**拼豆颜色 Key** (`mappedPixelData[j][i].key`)。
    *   使用 `downloadCanvas.toDataURL('image/png')` 生成图片数据并触发下载。

7.  **生成 JSON 数据 (`handleDownloadJson`)**:
    *   用户点击"下载数据 (JSON)"按钮时触发。
    *   从 `mappedPixelData` 提取出一个只包含颜色 Key 的二维数组 `keyGrid`。
    *   将 `keyGrid` 序列化为格式化的 JSON 字符串。
    *   创建 Blob 对象并生成可下载的 `.json` 文件。

### 调色板数据

拼豆的颜色数据定义在 `src/app/page.tsx` 文件顶部的 `beadPaletteData` 对象中。该数据由用户提供，并预处理为包含 Key、Hex 和 RGB 值的 `beadPalette` 数组。

**重要**: 调色板数据的准确性直接影响最终的颜色映射结果。请在使用前仔细核对 Key 和 Hex 值。如有需要，可以直接修改 `beadPaletteData` 来添加、删除或修改颜色。

## 本地开发

1.  克隆项目:
    ```bash
    git clone <repository-url>
    cd perler-beads-generator
    ```
2.  安装依赖:
    ```bash
    npm install
    # or yarn install or pnpm install
    ```
3.  启动开发服务器:
    ```bash
    npm run dev
    # or yarn dev or pnpm dev
    ```
4.  在浏览器中打开 `http://localhost:3000`。

## 部署

该项目可以轻松部署到 [Vercel](https://vercel.com/) 平台：

1.  将代码推送到 GitHub/GitLab/Bitbucket 仓库。
2.  在 Vercel 上导入该 Git 仓库。
3.  Vercel 会自动识别 Next.js 项目并进行部署。

## 未来可能的改进

*   **颜色距离算法**: 使用更符合人类视觉感知的颜色距离算法，如 CIEDE2000 (Delta E)，以获得更精确的颜色匹配（但这会显著增加计算复杂度）。
*   **性能优化**: 对于超大图片或极高精细度，考虑使用 Web Workers 将图像处理和颜色计算移到后台线程，防止 UI 卡顿。
*   **调色板管理**: 提供 UI 界面允许用户上传、编辑或选择不同的调色板。
*   **预览交互**: 在预览图上悬停显示颜色 Key 或统计颜色用量。

## 许可证

Apache 2.0
