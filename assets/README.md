# assets

图片与 UI 美术资源统一放在这里，不把 Base64 图片内嵌进游戏核心。

建议目录：

```text
assets/
  art/
    scenes/
    portraits/
    items/
    enemies/
  ui/
    icons/
    frames/
  manifest.js
```

正式接图时由 `assets/manifest.js` 维护“游戏语义 -> 资源路径”的映射，由 `src/ui/art-layer.js` 负责渲染。
