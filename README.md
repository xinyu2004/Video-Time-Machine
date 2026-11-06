# Video Time Machine

[中文](README_zh.md)

A bilingual guide to how pictures came to look like this: mains frequency, the factors of the line counts, NTSC and PAL subcarriers, then CCIR 601, ITU-R BT.709, and BT.2020. Each phenomenon page states the cause, whether it can be removed, and an FFmpeg command you can rerun.

The lab steps through fields and phase. Real filter output is the PNG contact sheet from `npm run samples`, not a JavaScript rewrite of yadif.

## Prerequisites

Tried on Node 22 and FFmpeg 6.1, and also on FFmpeg 8.0. Older versions are fine to try. The site itself needs Node. The contact sheets need FFmpeg. These are the filters the recipes talk about:

- `bwdif` rebuilds a progressive frame from real interlace: still areas stay woven, the moving edge is interpolated.
- `colorspace` rewrites the sample numbers when a picture was encoded with the 601, 709, or 2020 matrix. `setparams` only changes the label on the file.
- `deflicker` flattens a flicker that brightens and darkens the whole frame together. A band that rolls down the picture is a different problem.
- `zscale` is the other filter that can rewrite those color samples. Building it needs libzimg. The commands in this repo use `colorspace`.

```bash
npm run doctor
```

That is this repo's check, not npm's own `npm doctor`. It does not install anything, and it does not ask whether you are on the newest release. A version we have not tried is a note. The command exits with an error only when Node, FFmpeg, or one of those three filters is missing. `npm install` only installs this repo's packages.

## See the site

Do this once, from the repo root. Skip a step when that work is already on disk and nothing it depends on has changed.

```bash
npm install
npm run samples
```

`npm install` fills `node_modules`. Run it again only after the dependencies in `package.json` change.

`npm run samples` writes the contact sheets to `media/generated/`. Those pictures are not in git. Run it again only when a recipe command changes, when that folder is deleted, or when you want frames from another FFmpeg build. A second run deletes the old frames and renders them all again.

Then start the server when you want to look:

```bash
npm run dev
```

The terminal prints the address. Open the English pages at `/en` and the Chinese pages at `/zh` on that host. This server listens on every interface. Leave the terminal running while you read.

Stopping it with Ctrl+C turns the site off. The files stay where they are. The browser cannot open the pages until you run `npm run dev` again.

`npm run build` is for a static package in `apps/web/dist`, not for reading the site. It runs `npm run check` first, which verifies that Chinese and English pages come in pairs, that recipe ids resolve, and that a few lamp-beat numbers match. `npm run dev` does not build that package, and neither command renders the contact sheets.

## Where the content lives

- `content/timeline/{zh,en}/` — eight chapters
- `content/phenomena/<id>/{zh.mdx,en.mdx,meta.yaml}` — `removability` is one of `prevent`, `invert`, `attenuate`, `baked`
- `content/recipes/*.yaml` — diagnose, fix, and avoid commands. The site reads these and does not keep a second copy in MDX
- `content/decide/tree.yaml` — symptom tree
- `content/glossary/{zh,en}.mdx`
- `apps/web/src/lab/` — raster, divider chain, fields, split, 3:2, lamp beat, temporal window, gamut, contact sheet

`tools/emit-*.mjs` rewrites phenomenon pages, recipes, and the glossary. Edits in those files are overwritten if you run the generators again.

## Out of scope

A 60 Hz panel cannot stand in for a 50 Hz lamp or an interlaced CRT. The pages say so. QTGMC and VapourSynth are named as tools outside FFmpeg, not ported. BT.2100 PQ/HLG tone mapping is not in the recipes: BT.2020 widens the primaries and keeps an SDR curve; HDR changes the curve.
