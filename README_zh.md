# 视频演变图鉴

[English](README.md)

中英双语的视频演变知识站。时间线从市电频率、行数因数、NTSC/PAL 副载波，写到 CCIR 601、ITU-R BT.709 和 BT.2020。现象页说明梳齿、拆场、灯光拍频、矩阵和范围：原因、能不能消，以及一条可以复现的 FFmpeg 命令。

实验室用逐场步进和相位图讲机制。滤镜的真实结果是 `npm run samples` 生成的 PNG，不是在浏览器里重写 yadif。

## 前提

在 Node 22 和 FFmpeg 6.1 上试过，FFmpeg 8.0 上也试过。更旧的版本可以先跑跑看。站点本身要 Node。对照样片要 FFmpeg。配方里会碰到这些滤镜：

- `bwdif` 把真隔行收成逐行：静止的地方用编织，运动的边缘重新算。
- `colorspace` 在 601、709、2020 矩阵用错时改样点里的数。`setparams` 只改文件上的标签。
- `deflicker` 把整幅一起亮暗的闪拉平。顺着画面滚的横条是另一件事。
- `zscale` 是另一条能改这些颜色样点的路，编译时要带 libzimg。本仓库的命令用的是 `colorspace`。

```bash
npm run doctor
```

这是本仓库的检查，不是 npm 自带的 `npm doctor`。它不安装任何东西，也不问你是不是最新版。没试过的版本只是一句提醒。只有 Node、FFmpeg 或上面三个滤镜缺了，才会以错误退出。`npm install` 只安装这个仓库的 npm 包。

## 看站点

在仓库根目录做一次。某一步的结果还在，而且它依赖的东西没改，就跳过。

```bash
npm install
npm run samples
```

`npm install` 装好 `node_modules`。只有 `package.json` 里的依赖变了，才再跑。

`npm run samples` 把对照样片写到 `media/generated/`。这些图不进 git。配方命令改了、这个目录被删了、或者想用另一版 FFmpeg 重新出图，才再跑。再跑会删掉旧图并全部重渲。

要看的时候再开服务器：

```bash
npm run dev
```

终端会打出地址。中文页在该地址的 `/zh`，英文页在 `/en`。这个服务器听所有网卡。看的时候让这个终端一直开着。

用 Ctrl+C 停掉之后，站点就关了。文件还在原处。浏览器要等你再执行一次 `npm run dev` 才能打开。

`npm run build` 用来打静态包，输出在 `apps/web/dist`，不是用来看站的。它会先跑 `npm run check`，核对中英成对、配方引用，以及灯光拍频的几个已知数值。`npm run dev` 不打这个包。这两个命令也都不生成样片。

## 内容放在哪

- `content/timeline/{zh,en}/` 八章
- `content/phenomena/<id>/{zh.mdx,en.mdx,meta.yaml}` 现象。`removability` 是 `prevent`、`invert`、`attenuate`、`baked` 之一
- `content/recipes/*.yaml` 诊断、处理和不要做的命令。站点上的命令块只读这里
- `content/decide/tree.yaml` 症状决策树
- `content/glossary/{zh,en}.mdx`
- `apps/web/src/lab/` 光栅、分频链、两场、拆场、3:2、灯光、时间窗、色度三角形、样片对照

`tools/emit-*.mjs` 会重写现象页、配方和术语。手改过的文件再跑这些脚本会被覆盖。

## 做不到的事

60 Hz 屏幕不能代替 50 Hz 的灯或隔行显像管，页面上写了这句话。QTGMC / VapourSynth 只作为 FFmpeg 之外的参照。BT.2100 的 PQ/HLG 色调映射不在配方里：2020 规定的是更宽的三基色和 SDR 曲线，HDR 换的是曲线。
