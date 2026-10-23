# Starry Sky

一個會隨著音樂變化的星際外太空視覺化網頁。它讀取瀏覽器分頁、系統背景音、麥克風或本機音檔的聲音，即時分析頻譜與節拍，讓星空、星雲、粒子和星系跟著音樂律動(目前預設使用極光)。

---

## 功能規劃

### 音源輸入

| 音源 | 取得方式 | 備註 |
|---|---|---|
| 瀏覽器分頁音樂（YouTube、Spotify Web 等） | `navigator.mediaDevices.getDisplayMedia()` | 分享分頁時勾選「分享分頁音訊」 |
| 系統背景音 | `getDisplayMedia()` 分享整個螢幕 | 限 Windows 上的 Chrome / Edge，需勾選「分享系統音訊」 |
| 麥克風 | `navigator.mediaDevices.getUserMedia()` | 可收外部喇叭或現場音樂 |
| 本機音檔 | `<input type="file">` + `<audio>` | 不需授權，適合開發測試 |

> 瀏覽器基於安全限制，每次使用分頁或系統音訊都必須由使用者手動授權，網頁無法自動擷取。

### 音樂對應的視覺效果

| 音訊特徵 | 視覺效果 |
|---|---|
| 低音（Bass） | 星雲脈動、鏡頭推進、整體亮度起伏 |
| 中音（Mid） | 星系旋轉速度、色彩變化 |
| 高音（Treble） | 星星閃爍、流星出現 |
| 節拍（Beat） | 光暈爆發、粒子噴發 |
| 整體音量 | 粒子速度與擴散範圍 |

### 視覺元素

- **星空背景**：數萬顆不同大小、亮度和顏色的星點，底色為藍黑色
- **星座**：獵戶座、北斗七星、仙后座、天蠍座、天鵝座、獅子座、天琴座、南十字座，依真實星圖連線，每一拍輪流點亮一個，以淡淡的方式顯示（`SHOW_CONSTELLATIONS` 開關）
- **星雲**：以 shader 產生的淡淡流動雲霧，融入藍黑色背景（`SHOW_NEBULA` 開關）
- **星系**：旋臂狀的粒子星系，會緩慢旋轉（目前暫時關閉，可在 `src/main.js` 把 `SHOW_GALAXY` 設為 `true` 恢復）
- **極光音波**：畫面下方三層極光簾幕，左低音、右高音，越響的頻段簾幕升得越高越亮，顏色由綠、青到紫並隨音樂流轉（`SHOW_AURORA` 開關）
- **音波星座**（目前改用極光，`SHOW_SOUNDWAVE` 開關）：畫面下方一列 15 顆星組成的音波，左右滿版，左低音、右高音，高度跟著頻譜起伏，顏色隨音樂流轉並帶有呼吸光暈（`SHOW_SOUNDWAVE` 開關；倒影可用 `reflection: true` 打開）
- **流星雨**：從畫面右上方的輻射點劃過，音量與高音決定密度，每一拍落下一批，低音越強越亮越長
- **節拍粒子**：每一拍從星系中心沿盤面噴出（跟星系一起暫時關閉）
- **後製特效**：Bloom 光暈，營造發光的宇宙感

---

## 技術棧

| 類別 | 技術 | 用途 |
|---|---|---|
| 建置工具 | [Vite](https://vitejs.dev/) | 開發伺服器、熱更新、打包 |
| 語言 | JavaScript（ES Modules） | 主要開發語言 |
| 3D 繪圖 | [Three.js](https://threejs.org/) | 以 WebGL 繪製星空、粒子、星雲 |
| 著色器 | GLSL | 自訂星雲、星點閃爍等 shader 效果 |
| 後製特效 | Three.js `EffectComposer` + `UnrealBloomPass` | 光暈、發光效果 |
| 音訊分析 | Web Audio API（`AudioContext`、`AnalyserNode`） | FFT 頻譜分析、音量與節拍偵測 |
| 音源擷取 | Media Capture API（`getDisplayMedia`、`getUserMedia`） | 取得分頁、系統或麥克風音訊 |
| UI | 原生 HTML / CSS | 音源選擇按鈕等少量介面 |

### Three.js
本專案的畫面主要是一個全螢幕 canvas 加上少量按鈕，用不到 React 的元件管理優勢。動畫透過 `requestAnimationFrame` 直接更新，也比較好控制效能。

未來如果需要大量設定面板（顏色、粒子數、主題切換等），可以再引入 React 搭配 [react-three-fiber](https://docs.pmnd.rs/react-three-fiber)。

---

## 專案結構

```
starry_sky/
├── index.html            # 入口頁面
├── package.json
├── vite.config.js
├── public/               # 靜態資源（測試音檔、貼圖）
└── src/
    ├── main.js           # 程式進入點、後製光暈、鏡頭與動畫主迴圈
    ├── audio/
    │   ├── sources.js    # 音源擷取（分頁 / 系統 / 麥克風 / 檔案）
    │   └── analyser.js   # 頻譜分析、頻段切分、節拍偵測
    ├── scene/
    │   ├── stars.js      # 星空背景
    │   ├── nebula.js     # 星雲
    │   ├── galaxy.js     # 旋臂星系
    │   └── meteors.js    # 流星與節拍粒子
    ├── shaders/          # GLSL 著色器
    ├── ui/
    │   └── controls.js   # 音源選擇介面、快捷鍵、拖放音檔
    └── style.css
```

---

## 使用方式

1. 執行 `npm run dev`，瀏覽器會自動開啟頁面
2. 點選下方面板的音源：
   - **分頁音訊**：選擇正在播音樂的分頁，勾選「同時分享分頁音訊」
   - **系統音訊**：選擇「整個螢幕」，勾選「同時分享系統音訊」
   - **麥克風**：允許麥克風權限
   - **音檔**：選擇本機音樂檔，或直接把檔案拖進畫面
3. 有音源時，滑鼠靜止 3 秒介面會自動隱藏

| 快捷鍵 | 功能 |
|---|---|
| `H` | 隱藏 / 顯示介面 |
| `F` | 全螢幕 |

> 網址加上 `?demo`（例如 `http://localhost:5173/?demo`）可以用模擬的音樂數值預覽效果，不需要任何音源。
> 備註:瀏覽器需使用硬體加速：到 Chrome / Edge 的「設定 → 系統」，確認「使用圖形加速」有打開。


---

## 開發方式

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器
npm run dev

# 打包正式版
npm run build
```

> `getDisplayMedia` 和 `getUserMedia` 只能在 `localhost` 或 HTTPS 環境下使用。

---

## 瀏覽器支援

| 瀏覽器 | 分頁音訊 | 系統音訊 | 麥克風 |
|---|---|---|---|
| Chrome / Edge（Windows） | ✅ | ✅ | ✅ |
| Chrome / Edge（macOS） | ✅ | ❌ | ✅ |
| Firefox | ❌ | ❌ | ✅ |
| Safari | ❌ | ❌ | ✅ |

---

## 未來發展

1. **Wallpaper Engine 動態桌布**：Wallpaper Engine 支援網頁桌布，並提供系統音訊 API（`wallpaperRegisterAudioListener`），可以直接跟著電腦播放的任何聲音律動，不需手動授權。
2. **Electron 桌面應用程式**：包成獨立程式，透過 WASAPI loopback 直接擷取系統音訊。
3. **設定面板**：主題配色、粒子密度、靈敏度調整。
