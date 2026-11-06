# Video Time Machine

[中文](README_zh.md)

[![Timeline dial, stopped on Raster](media/readme/dial-en.png)](https://xinyu2004.github.io/Video-Time-Machine/)

Open the picture, or open https://xinyu2004.github.io/Video-Time-Machine/

The site opens in English. Chinese is the same address with `/zh`.

Why a picture looks the way it does: the mains, the line count, NTSC and PAL, then CCIR 601, BT.709, and BT.2020. Each entry gives the cause, and whether that look can be undone.

## On the site

- **Timeline.** The chart on the front page, read along the years.
- **From the look.** You see a look. Ask why.
- **Phenomena.** The entries, once you know which one you are looking at.
- **Glossary.** The words.

## On your machine

Node is enough to read the site. From the repo root:

```bash
npm install
npm run dev
```

The terminal prints the address.

- `content/timeline/{zh,en}/` chapters
- `content/phenomena/<id>/{zh.mdx,en.mdx,meta.yaml}` entries
- `content/recipes/*.yaml` the commands shown on the site
- `content/decide/tree.yaml` From the look
- `content/glossary/{zh,en}.mdx`
- `apps/web/src/lab/` the figures

`tools/emit-*.mjs` rewrites the entries, the commands, and the glossary. Running one again overwrites hand edits.

## Left out

A 60 Hz panel cannot stand in for a 50 Hz lamp or an interlaced CRT. The pages say so. QTGMC and VapourSynth are named and not brought in. BT.2100 PQ/HLG tone mapping is not here: BT.2020 widens the primaries and keeps an SDR curve; HDR changes the curve.
