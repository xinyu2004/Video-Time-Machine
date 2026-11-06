import { writePhenomenon } from './phlib.mjs'

const P = []

function add(entry) { P.push(entry) }

add({
  id: 'combing', group: 'interlace', era: 'interlace', removability: 'attenuate',
  tags: ['interlace'], related: ['psf-vs-adjacent', 'yadif-bwdif', 'ivtc-vs-deinterlace'],
  labWidgets: ['FieldLoom', 'FrameCompare'], recipeIds: ['detect-idet', 'bwdif-field'], displayCaveat: 'crt',
  widget: '<FieldLoom />\n\n<FrameCompare samples="adjacent-weave,adjacent-bob,adjacent-yadif,adjacent-bwdif" />',
  zh: {
    title: '梳齿', summary: '两场来自不同时刻时，竖边会裂成一排短齿。',
    parts: [
      '运动物体的竖边变成一排上下错开的短横齿。静止的细横线仍然是齐的。',
      '隔行的两场曝光相差一场时间。编织成一帧时，运动边缘对不齐。同一帧拆场（PsF）不会出这种齿。链回 <TLink slug="raster" />。',
      '逐场看，物体位置不同。`idet` 反复给出 interlaced，而不是一串 progressive。',
      '样片里窗子不动，人跨出一大步。编织时窗子是齐的，人裂成两场。yadif 之后窗子仍齐，人身上的齿减轻。bwdif 多看了下一场，这段短图上和 yadif 很接近。',
      '只能减轻。运动自适应去隔行能去掉齿，垂直细节和运动不能同时保持原样。已经在错误编织上再编码的齿，滤镜只能再猜一次。',
      '先排除 PsF 和 3:2。确认是真隔行之后，优先 `bwdif=mode=send_field`。',
      '不要对整段直接 yadif。3:2 会伤胶片格，PsF 会被打软。',
    ],
  },
  en: {
    title: 'Combing', summary: 'When the two fields are different times, vertical edges split into short teeth.',
    parts: [
      'Vertical edges of moving objects break into a row of short horizontal teeth. Fine static lines stay straight.',
      'The two interlaced fields are exposed a field apart. Woven into one frame, a moving edge does not agree. PsF, both fields from one instant, does not comb. See <TLink slug="raster" />.',
      'Step the fields: the object has moved. `idet` keeps reporting interlaced rather than a run of progressive.',
      'In the samples the window stays still and the person takes a long step. Woven, the window is aligned and the person splits into two fields. After yadif the window is still straight and the teeth ease off. bwdif also looks at the next field. On this short clip it stays close to yadif.',
      'Attenuation only. A motion-adaptive deinterlacer removes the teeth and cannot keep both vertical detail and motion untouched. Teeth baked in by a bad weave can only be guessed at again.',
      'Rule out PsF and 3:2 first. For real interlace, prefer `bwdif=mode=send_field`.',
      'Do not run yadif over the whole file. It damages 3:2 film frames and softens PsF.',
    ],
  },
})

add({
  id: 'psf-vs-adjacent', group: 'progressive', era: 'interlace', removability: 'invert',
  tags: ['interlace', 'psf'], related: ['combing', 'progressive-panel', 'ivtc-vs-deinterlace'],
  labWidgets: ['DisplayPath', 'FrameCompare'], recipeIds: ['psf-weave', 'bwdif-field'], displayCaveat: 'crt',
  widget: '<DisplayPath />\n\n<FrameCompare samples="psf-original,psf-yadif,adjacent-weave" />',
  zh: {
    title: '同一帧拆场与相邻帧拆场', summary: 'PsF 的两场来自同一曝光。相邻帧拆场才会梳。',
    parts: [
      '隔行壳里有两种货。PsF 看起来像一幅完整的逐行画面，细线是齐的。相邻帧拆场在运动处发梳。',
      '逐行要送到只画一场的链路上，必须拆场。同一帧拆成奇数行和偶数行，是 PsF，广播里的 25PsF、24PsF、30PsF 都是这种壳。第一场取第 N 帧、第二场取第 N+1 帧，才是真隔行。1080p25 进 1080i50 常常是前者。见 <TLink slug="hd-uhd" />。',
      '`idet` 对 PsF 常给出 progressive 或不确定。逐场看，物体没有移动。样片里 psf-yadif 是把逐行图当成隔行、抽出底场再拉高。细线只在顶场，这一格里没了。静止的 PsF 送进 yadif 常常被编织回去，看起来像没事；送去 bob 才会这样。',
      '实验室可以并排切换 PsF 和相邻帧，并在逐行面板上选 weave 或 bob。',
      '壳还在、样点还没被 bob 过：可以还原，把标记改回逐行并编织。已经 bob 过再编码：写进样点。',
      '完整的 PsF 用 weave，或 `setfield=prog`。不要去隔行。',
      '不要对 PsF 使用 bwdif 或 yadif。样片第三格就是这件事。',
    ],
  },
  en: {
    title: 'Same-frame split and adjacent-frame split', summary: 'PsF takes both fields from one exposure. Adjacent frames are what comb.',
    parts: [
      'An interlaced shell can carry two different goods. PsF looks like a whole progressive picture and fine lines agree. An adjacent-frame split combs on motion.',
      'A progressive picture headed for a field-at-a-time link has to be split. Odd lines and even lines from the same frame are PsF: 25PsF, 24PsF, and 30PsF in broadcast. Taking field one from frame N and field two from frame N+1 is real interlace. 1080p25 inside 1080i50 is often the first. See <TLink slug="hd-uhd" />.',
      '`idet` often says progressive or undetermined for PsF. Stepping fields, the object has not moved. The psf-yadif still treats that progressive frame as interlaced, keeps the bottom field, and stretches it. The fine lines live only in the top field, so they are gone here. yadif often weaves a still PsF back together; bob is what actually does this.',
      'The lab switches PsF and adjacent frames, and the progressive panel can weave or bob.',
      'If the shell is intact and nobody has bobbed it, retag and weave: reversible. If it was bobbed and encoded again, it is in the samples.',
      'Intact PsF wants weave, or `setfield=prog`. It does not want a deinterlacer.',
      'Do not run bwdif or yadif on PsF. The third still is that mistake.',
    ],
  },
})

add({
  id: 'progressive-panel', group: 'interlace', era: 'display', removability: 'attenuate',
  tags: ['interlace', 'display'], related: ['psf-vs-adjacent', 'weave-blend-bob', 'yadif-bwdif'],
  labWidgets: ['DisplayPath'], recipeIds: ['bwdif-field', 'psf-weave'], displayCaveat: 'crt',
  widget: '<DisplayPath />',
  zh: {
    title: '隔行画到逐行面板上', summary: '液晶没有场。weave、bob、运动自适应留下的东西不一样。',
    parts: [
      '面板上要么看到梳齿，要么看到发软的细线，要么看到细线上下跳。',
      '液晶每一帧都是逐行。隔行素材必须先变成逐行。weave 把两场拼起来：PsF 和静止区域是对的，真隔行的运动区域出梳齿。bob 把每一场拉成一帧，帧率加倍，垂直细节减半。运动自适应在静止处编织、在运动处抛场或插值。',
      '同一段素材分别做 weave、bob、bwdif，对着看。PsF 被误判成真隔行再 bob 时，细线发虚。',
      '把拆场方式设成 PsF，面板设成 bob，就是这个误判。',
      '播放器里的一次性去隔行只能减轻。原始场还在的文件可以换一条更好的路，标成可以还原的是「还没处理过的壳」。',
      '真隔行交给 bwdif。PsF 交给 weave。',
      '不要把「逐行面板默认去隔行」当成已经确认过片源。',
    ],
  },
  en: {
    title: 'Interlace on a progressive panel', summary: 'An LCD has no fields. Weave, bob, and motion-adaptive processing leave different pictures.',
    parts: [
      'On the panel you either see teeth, softened fine lines, or fine lines that bob up and down.',
      'An LCD frame is progressive, so interlaced material has to become progressive first. Weave stacks the fields: right for PsF and for still areas, combing where real interlace moved. Bob stretches each field to a frame, doubles the rate, and halves vertical detail. Motion-adaptive filters weave still areas and interpolate motion.',
      'Compare weave, bob, and bwdif on one source. PsF mistaken for real interlace and then bobbed looks soft in the fine lines.',
      'Set the split to PsF and the panel to bob. That is the misread.',
      'A player’s one-pass deinterlace only attenuates. A file that still has the original fields can take a better path. Reversible applies to a shell that has not been processed yet.',
      'Real interlace goes to bwdif. PsF goes to weave.',
      'Do not treat the panel’s default deinterlacer as a source identification.',
    ],
  },
})

add({
  id: 'field-order', group: 'interlace', era: 'interlace', removability: 'invert',
  tags: ['interlace', 'tff', 'bff'], related: ['combing', 'yadif-bwdif'],
  labWidgets: ['FieldLoom'], recipeIds: ['fieldorder-swap', 'detect-idet'], displayCaveat: 'crt',
  widget: '<FieldLoom />',
  zh: {
    title: '场序反了', summary: 'TFF 和 BFF 标反或存反时，运动像每场抖一下。',
    parts: [
      '运动不顺，像每场都扭一下，静止画面往往看不出。',
      'TFF 和 BFF 是码流里的场序标签，ffprobe 里叫 field_order。它只说明哪一场时间在前。标签写错、扫描行没存错时，去隔行会按反的时间插值。setfield 改的就是这个标签，样点不动。行本身存反了，画面会在场与场之间来回跳，那要 fieldorder，它会改行。',
      '看左右两格的走动，不要看静止画面。`ffprobe` 的 `field_order` 就是码流里的那个标签。静止画面一样，只说明 setfield 没有改样点。',
      '上面两格按 setfield=tff 和 setfield=bff 播。标对了往前走，标反了每场退一下。暂停时两边是同一场。左下是 setfield，改成 TFF：静止画面不动，下面几步才分出顺和不顺。右下是 fieldorder：衣服竖边放大四倍，前后并排，行对调之后齿翻过去。窗子两场一样，放大了也看不出。位移比真实的 1/50 秒拉开了。',
      '只是码流里的 field_order 写错、样点仍是原顺序：可以还原，`setfield` 改标签。播放器已经按错误顺序重编码：写进样点，要用 `fieldorder`。',
      '标签用 `setfield=tff` 或 `bff`。样点顺序错了用 `fieldorder`，它会改画面。',
      '不要在场序没核对之前跑 bwdif 的 parity=auto 就当完成。',
    ],
  },
  en: {
    title: 'Field order reversed', summary: 'TFF and BFF swapped, as a flag or in the samples, makes motion twitch every field.',
    parts: [
      'Motion does not track. It twitches once a field. A still frame often looks fine.',
      'TFF and BFF are the field_order flag in the bitstream. ffprobe reports that flag. It only says which field is earlier. A wrong flag on correctly stored lines makes a deinterlacer walk backwards in time. setfield rewrites the flag and leaves the samples alone. If the lines themselves were stored backwards, the picture jumps between fields, and that takes fieldorder, which moves lines.',
      'Watch the two walks, not the still. `ffprobe` `field_order` is the flag in the bitstream. An unchanged still only means setfield did not move the samples.',
      'The top plays setfield=tff and setfield=bff. A matching flag walks forward. A mismatched flag steps back each field. Paused, both sides hold one field. Bottom left is setfield, set to TFF: the still does not move, and the short walk underneath is the only difference. Bottom right is fieldorder: the shirt edge at four times, before and after. Swapping the lines flips the teeth. The window matches in both fields, so a zoom there shows nothing. The step is stretched past a real 1/50 s.',
      'A wrong field_order flag on intact samples is reversible with `setfield`. A file re-encoded in the wrong order is already in the samples, and that takes `fieldorder`.',
      'Fix a flag with `setfield=tff` or `bff`. Fix stored order with `fieldorder`, which changes the picture.',
      'Do not treat `bwdif` with parity=auto as finished before the field order is checked.',
    ],
  },
})

add({
  id: 'weave-blend-bob', group: 'interlace', era: 'interlace', removability: 'attenuate',
  tags: ['interlace'], related: ['combing', 'yadif-bwdif', 'psf-vs-adjacent'],
  labWidgets: ['FrameCompare'], recipeIds: ['bob-blend', 'psf-weave'], displayCaveat: 'diagram',
  widget: '<FrameCompare samples="adjacent-weave,adjacent-bob,adjacent-yadif,adjacent-bwdif" />',
  zh: {
    title: '编织、混合、抛场', summary: '三种朴素做法各自丢掉不同的信息。',
    parts: [
      '编织保留齿。混合把齿涂糊。抛场去掉齿，细线变粗并且上下跳。',
      'weave 把两场叠成一帧，时间差留在样点里。blend 把两场平均，齿的幅度下降，垂直细节和运动一起糊。bob 丢掉另一场，每场拉高，帧率加倍。',
      '样片第一格是编织，第二格是抛场。对着第三、四格的自适应结果看。',
      '对照帧来自同一段相邻帧拆场。',
      '三种都只能减轻，而且减轻的是不同的东西。PsF 上的 weave 是还原，不在这三种「处理真隔行」里。',
      '真隔行不要停在 blend。要运动，用 bob 或 bwdif 的 send_field。要一帧一图，接受 send_frame 的损失。',
      '不要用 tblend 把齿糊掉然后当作去隔行完成。',
    ],
  },
  en: {
    title: 'Weave, blend, bob', summary: 'The three naive paths throw away different information.',
    parts: [
      'Weave keeps the teeth. Blend smears them. Bob removes the teeth, thickens fine lines, and makes them jump.',
      'Weave stacks the fields and leaves the time offset in the samples. Blend averages the fields, so the teeth shrink and so do vertical detail and motion. Bob discards the other field, stretches each field, and doubles the rate.',
      'The first still is the weave, the second is the bob. Compare them with the adaptive third and fourth.',
      'All four come from one adjacent-frame split.',
      'All three only attenuate, and they attenuate different things. Weave on PsF is a restoration, not one of these three treatments of real interlace.',
      'Do not stop at blend for real interlace. For motion, use bob or bwdif send_field. For one picture per frame, accept what send_frame loses.',
      'Do not tblend the teeth away and call the file deinterlaced.',
    ],
  },
})

add({
  id: 'yadif-bwdif', group: 'interlace', era: 'digital', removability: 'attenuate',
  tags: ['deinterlace', 'yadif', 'bwdif'], related: ['combing', 'weave-blend-bob', 'psf-vs-adjacent'],
  labWidgets: ['FrameCompare'], recipeIds: ['bwdif-field', 'yadif-field'], displayCaveat: 'diagram',
  widget: '<FrameCompare samples="adjacent-yadif,adjacent-bwdif,psf-yadif" />',
  zh: {
    title: 'yadif 与 bwdif', summary: '两者都假定输入是真隔行。FFmpeg 里优先 bwdif。',
    parts: [
      '齿少了，运动还在。细斜线偶尔还有残留或轻微锯齿。PsF 经过它们会变软。',
      'yadif 和 bwdif 都是运动自适应：静止区域倾向编织，运动区域倾向抛场或插值。bwdif（Bob Weaver）在 FFmpeg 里通常比 yadif 少一点锯齿。`mode=send_frame` 一帧一帧输出，`mode=send_field` 一场一帧、帧率加倍。`parity` 指定 TFF 或 BFF。`deint=interlaced` 只处理标成隔行的帧。',
      '第三格是同一张逐行图被抽出底场再拉高。细线只在顶场，不该被这场丢掉。静止 PsF 送进 yadif 往往又被编织回去。',
      '前两格是同一隔行源的 yadif 与 bwdif。',
      '只能减轻。它们不恢复被隔行丢掉的那一场里的垂直细节。',
      '真隔行优先 `bwdif=mode=send_field:parity=tff`。输出要跟源帧率一样时才用 send_frame。',
      '不要用在 PsF 上，也不要用在还没拆开的 3:2 上。',
    ],
  },
  en: {
    title: 'yadif and bwdif', summary: 'Both assume real interlace. In FFmpeg, prefer bwdif.',
    parts: [
      'The teeth are gone and the motion is still there. Fine diagonals may keep a little residual or a slight stair. PsF run through either filter goes soft.',
      'yadif and bwdif are motion adaptive: still areas tend to weave, moving areas tend to bob or interpolate. bwdif (Bob Weaver) usually stairs less than yadif in FFmpeg. `mode=send_frame` emits one frame per input frame. `mode=send_field` emits one frame per field and doubles the rate. `parity` selects TFF or BFF. `deint=interlaced` touches only frames flagged interlaced.',
      'The third still is the same progressive picture with the bottom field extracted and stretched. The fine lines live only in the top field, so this field should not have been the one a player kept. yadif often weaves a still PsF back together.',
      'The first two stills are yadif and bwdif on one interlaced source.',
      'Attenuation only. They do not restore vertical detail the other field never captured.',
      'For real interlace prefer `bwdif=mode=send_field:parity=tff`. Use send_frame only when the output rate must match the source.',
      'Do not use them on PsF, or on 3:2 that has not been undone.',
    ],
  },
})

add({
  id: 'ivtc-vs-deinterlace', group: 'progressive', era: 'film', removability: 'invert',
  tags: ['telecine', 'ivtc'], related: ['judder', 'combing', 'mixed-cadence', 'psf-vs-adjacent'],
  labWidgets: ['Pulldown', 'FrameCompare'], recipeIds: ['fieldmatch-decimate', 'detect-idet'], displayCaveat: 'diagram',
  widget: '<Pulldown />\n\n<FrameCompare samples="telecine-23,adjacent-weave" />',
  zh: {
    title: '反电视电影还是去隔行', summary: '重复场走 fieldmatch 和 decimate。真隔行走 bwdif。',
    parts: [
      '画面按 2-3 的节拍顿一下，或者某些帧的两场来自不同胶片格，竖边发梳。硬去隔行之后，胶片格会被拆坏。',
      '3:2 把 24（实际 23.976）格铺成 60 场。视频帧是 AA BB BC CD DD。BC 和 CD 会梳，但正确的处理是找回胶片格，不是把每一场当成摄像机隔行。见 <TLink slug="film" />。',
      '看样片里的亮条：telecine 之后位置会按 3:2 重复。`idet` 会在 progressive 和 interlaced 之间来回。硬隔行则一直是 interlaced。',
      '下拉图把重复场和混合帧标出来。它不是 PsF。',
      '节拍还在、没有被重采样糊掉时，可以还原成 24p 一类的逐行。已经被 yadif 再编码的，写进样点。',
      '`fieldmatch` 接着 `decimate`。混合了视频镜头的段落不要整段用同一个节拍。',
      '不要对 3:2 直接 bwdif。',
    ],
  },
  en: {
    title: 'Inverse telecine or deinterlace', summary: 'Repeated fields take fieldmatch and decimate. Real interlace takes bwdif.',
    parts: [
      'The picture stutters in a 2-3 cadence, or some frames comb because their fields come from different film frames. A hard deinterlace then breaks the film frames.',
      '3:2 spreads 24 (actually 23.976) frames across 60 fields. Video frames are AA BB BC CD DD. BC and CD comb, and the repair is to recover the film frame, not to treat every field as a camera field. See <TLink slug="film" />.',
      'Watch the bar in the telecine stills: after telecine its position repeats in the 3:2 pattern. `idet` alternates progressive and interlaced. Hard interlace stays interlaced.',
      'The pulldown figure marks repeated fields and mixed frames. It is not PsF.',
      'While the cadence is intact, recovery to a 24p-style progressive sequence is reversible. After yadif and a re-encode, it is in the samples.',
      'Run `fieldmatch` then `decimate`. Do not use one cadence on a reel that also contains video shots.',
      'Do not bwdif 3:2 directly.',
    ],
  },
})

add({
  id: 'interlaced-chroma', group: 'interlace', era: 'digital', removability: 'attenuate',
  tags: ['chroma', '420'], related: ['combing', 'chroma-siting', 'bt601-sampling'],
  labWidgets: [], recipeIds: ['scale-interl'], displayCaveat: 'diagram',
  widget: '',
  zh: {
    title: '隔行色度', summary: '4:2:0 的隔行色度按场排。当逐行去缩放，彩色边缘会错位。',
    parts: [
      '运动物体的彩色边和亮度边错开，或者出现淡淡的彩色梳齿。',
      'MPEG 一类的 4:2:0 可以把色度按帧排，也可以按场排。隔行 4:2:0 的色度样点和场对齐。把整帧当成逐行去放大色度，就会拿错场的颜色。BT.601 本身是 4:2:2，4:2:0 是后来的播出格式。',
      '彩色边只在运动处错，静止处正常。`ffprobe` 看色度抽样和 field_order。',
      '这一条没有单独的动画。缩放配方里的 `interl=1` 就是告诉 scale 按场处理。',
      '只能减轻。色度在抽样时已经丢掉一半垂直分辨率，按场缩放只是不再用错那一半。',
      '隔行 4:2:0 缩放时加 `scale=interl=1`。先去隔行再缩放时，色度路径要和亮度路径一致。',
      '不要把隔行 4:2:0 直接 `scale=w=iw*2:h=ih*2` 当成逐行放大。',
    ],
  },
  en: {
    title: 'Interlaced chroma', summary: '4:2:0 interlaced chroma is stored per field. Scaled as progressive, color edges land on the wrong line.',
    parts: [
      'The color edge of a moving object separates from the luma edge, or a faint color comb appears.',
      'MPEG-style 4:2:0 can site chroma per frame or per field. Interlaced 4:2:0 aligns chroma with the fields. Upsampling the whole frame as progressive pulls color from the wrong field. BT.601 itself is 4:2:2. 4:2:0 came later, for emission.',
      'The color edge is wrong only where things moved. Stills look fine. `ffprobe` shows chroma subsampling and field_order.',
      'There is no separate animation. `interl=1` on scale is the switch that processes fields.',
      'Attenuation only. Chroma already lost half its vertical resolution at sampling time. Field-aware scale merely stops using the wrong half.',
      'Scale interlaced 4:2:0 with `scale=interl=1`. If you deinterlace first, keep the chroma path consistent with luma.',
      'Do not `scale=w=iw*2:h=ih*2` an interlaced 4:2:0 frame as if it were progressive.',
    ],
  },
})

for (const entry of P) writePhenomenon(entry)
console.log('wrote', P.length, 'interlace phenomena')
