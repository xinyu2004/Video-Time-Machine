import { Link, useParams } from 'react-router-dom'
import { useI18n, useLang } from '../i18n'
import {
  Alternator,
  ChromaPhase,
  DisplayPath,
  DividerChain,
  FieldLoom,
  FrameCompare,
  GamutStack,
  LightBeat,
  MainsMap,
  Pulldown,
  Raster,
  TemporalWindow,
  ToneMap,
} from '../lab'

const WIDGETS = {
  Alternator,
  ChromaPhase,
  MainsMap,
  Raster,
  DividerChain,
  FieldLoom,
  DisplayPath,
  Pulldown,
  LightBeat,
  TemporalWindow,
  GamutStack,
  ToneMap,
  FrameCompare,
} as const

type WidgetId = keyof typeof WIDGETS

const BLURB: Record<WidgetId, { zh: string; en: string }> = {
  Alternator: {
    zh: '线圈在磁场里转，感应电压是正弦。4 极、1500 转/分是 50 Hz，4 极、1800 转/分是 60 Hz。',
    en: 'A coil turning in a field induces a sine. Four poles at 1500 rpm is 50 Hz. Four poles at 1800 rpm is 60 Hz.',
  },
  MainsMap: {
    zh: '市电和模拟彩色制式分成两层。日本东边大约 50 Hz、西边大约 60 Hz，彩色制式都是 NTSC。',
    en: 'Mains and the analog color system are separate layers. Japan is about 50 Hz in the east and 60 Hz in the west, and NTSC on both sides.',
  },
  ChromaPhase: {
    zh: '同一张图。暖底一行是 NTSC，冷底三行是 PAL。画面的颜色可以选。',
    en: 'One figure. The warm row is NTSC. The three cool rows are PAL. The picture color can be chosen.',
  },
  Raster: {
    zh: '可见的行都是满的。625 看到 576，525 大约 480。两场轮流，每一场都把自己的行再画一遍。半行在消隐里。',
    en: 'Visible lines are complete. 625 shows 576. 525 shows about 480. The fields take turns, and each pass redraws its own lines. The half-line is in the blanking.',
  },
  DividerChain: {
    zh: '总行数拆成小整数，同步发生器才能逐级分频。彩色钟再乘上 1000/1001 或 1/625。',
    en: 'Total lines factor into small integers so a sync generator can divide down. The color clock then applies 1000/1001 or 1/625.',
  },
  FieldLoom: {
    zh: 'setfield 改码流里的 field_order。TFF 和 BFF 都是这个标签。标签对上就往前走，对不上就每场退一下，静止画面不动。fieldorder 才改行，衣服竖边放大四倍能看见齿翻过去。',
    en: 'setfield rewrites field_order in the bitstream. TFF and BFF are that flag. A match walks forward, a mismatch steps back, and the still stays. fieldorder is what moves the lines. The shirt edge at four times shows the teeth flip.',
  },
  DisplayPath: {
    zh: '同一帧拆场是 PsF。相邻帧拆场才会梳。逐行面板上对 PsF 做 bob，细线会发虚。',
    en: 'Splitting one frame is PsF. Splitting adjacent frames combs. Bobbing PsF on a progressive panel softens fine lines.',
  },
  Pulldown: {
    zh: '24 格按 2、3、2、3 场铺开。拼成的视频帧是 AA BB BC CD DD。BC 和 CD 不是 PsF。',
    en: '24 frames are held for 2, 3, 2, 3 fields. The video frames are AA BB BC CD DD. BC and CD are not PsF.',
  },
  LightBeat: {
    zh: '曝光盖住整数个灯周期时，整幅闪和横条一起消失。否则看拍频，以及快门是全局还是滚动。',
    en: 'An exposure that covers an integer number of lamp cycles removes both whole-frame flicker and bands. Otherwise read the alias, and whether the shutter is global or rolling.',
  },
  TemporalWindow: {
    zh: '停在灯最暗的一帧。窗越长，灯和屋子越靠近平均，人影越长。横条还在。',
    en: 'Held on the lamp’s darkest frame. A longer window pulls the lamp and the room toward the average and lengthens the ghosts. The bands stay.',
  },
  GamutStack: {
    zh: '三块色是矩阵。2020 多的是更艳的颜色，绿最明显。屏幕画不出真正的 2020，所以用缩小的一列来看少掉的饱和。601 没有三角形，525 是 SMPTE-C。',
    en: 'The three chips are the matrix. What 2020 adds is saturation, green most of all. The screen cannot emit real 2020, so a shrunk column shows the missing saturation. 601 has no triangle. 525 is SMPTE-C.',
  },
  ToneMap: {
    zh: '一张暗屋子。伽马滑块看暗部，2.2 和 2.4 是刻度，sRGB 单独一档。PQ 那页滑的是窗子的尼特，100、1000、4000。',
    en: 'One dark room. The gamma slider is the shadows, with marks at 2.2 and 2.4. sRGB is its own choice. The PQ page slides the window in nits: 100, 1000, and 4000.',
  },
  FrameCompare: {
    zh: '这些帧由 FFmpeg 生成。没有文件时，先在仓库根目录运行 npm run samples。',
    en: 'These frames come from FFmpeg. If the files are missing, run npm run samples from the repo root.',
  },
}

export function LabIndex() {
  const lang = useLang()
  const i18n = useI18n()
  return (
    <main className="page">
      <h1>{lang === 'zh' ? '实验室' : 'Lab'}</h1>
      <ul className="index plain">
        {(Object.keys(WIDGETS) as WidgetId[]).map((id) => (
          <li key={id}>
            <Link to={`/${lang}/lab/${id}`}>
              <strong>{i18n.lab[labelKey(id)]}</strong>
              <small>{BLURB[id][lang]}</small>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

export function LabPage() {
  const lang = useLang()
  const { widget = '' } = useParams()
  if (!isWidget(widget)) return <main className="page"><p>missing lab</p></main>
  const View = WIDGETS[widget]
  return (
    <main className="page wide">
      <h1>{BLURB[widget][lang].split('。')[0].split('.')[0]}</h1>
      <p className="lede">{BLURB[widget][lang]}</p>
      <View />
    </main>
  )
}

function isWidget(value: string): value is WidgetId {
  return value in WIDGETS
}

function labelKey(id: WidgetId): 'alternator' | 'atlas' | 'phase' | 'raster' | 'divider' | 'loom' | 'display' | 'pulldown' | 'light' | 'window' | 'gamut' | 'tone' | 'compare' {
  const map = {
    Alternator: 'alternator',
    MainsMap: 'atlas',
    ChromaPhase: 'phase',
    Raster: 'raster',
    DividerChain: 'divider',
    FieldLoom: 'loom',
    DisplayPath: 'display',
    Pulldown: 'pulldown',
    LightBeat: 'light',
    TemporalWindow: 'window',
    GamutStack: 'gamut',
    ToneMap: 'tone',
    FrameCompare: 'compare',
  } as const
  return map[id]
}
