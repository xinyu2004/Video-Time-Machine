import { writePhenomenon } from './phlib.mjs'

const P = []
const add = (e) => P.push(e)

add({
  id: 'light-beat', group: 'flicker', era: 'mains', removability: 'prevent',
  tags: ['flicker', 'pal'], related: ['rolling-bands', 'deflicker', 'shutter-24', 'field-phase-lamps'],
  labWidgets: ['LightBeat'], recipeIds: ['deflicker-am'], displayCaveat: 'refresh',
  widget: '<LightBeat />',
  zh: {
    title: '灯光拍频', summary: 'PAL 拍 50 Hz 的灯可以不闪。拍 60 Hz 的灯，默认 180° 消不掉。',
    parts: [
      '整幅一起亮暗，或者一道横条在滚。频率取决于灯和采样，不是一个固定的「闪烁滤镜」能通吃。',
      '白炽灯和电感镇流荧光灯的亮度是市电的两倍频：50 Hz 市电是 100 Hz 灯，60 Hz 市电是 120 Hz 灯。曝光时长等于整数个灯周期时，每一行的积分与起始相位无关，整幅闪和滚动横条一起消失。采样率整除灯频时，每一帧起始相位相同，整幅不随时间跳；曝光若不是整数周期，滚动快门的横条会钉在同一高度。其余情况，拍频是 |f − k×采样率| 折进 0 到采样率一半的最小值。见 <TLink slug="mains" />。',
      'PAL、全场约 1/50 秒：100 Hz 灯，100/50 = 2，1/50 秒等于两个周期，不闪。120 Hz 灯，按 50 Hz 采样是 20 Hz；编织成 25 帧后折成 5 Hz（120 − 5×25）。把 25 fps 的快门改成 150°（1/60 秒）或 300°（1/30 秒）才是整数周期。',
      '预设里有 PAL+50 Hz 灯、PAL+60 Hz 灯、59.94、24 fps 的 172.8° 和 144°。图是积分，不是这块屏幕上的灯。',
      '拍摄时盖住整数周期，标成可以避免。成片若只是整帧一个增益，deflicker 只能减轻。横条按行写进去之后，标成已经写进样点。',
      '能重拍就改快门或换高频灯。只能后期时，确认是整幅增益再用 deflicker。',
      '不要用 deflicker 去拉滚动横条，也不要整段 tmix 糊掉就算修好。',
    ],
  },
  en: {
    title: 'Lamp beat', summary: 'PAL on a 50 Hz lamp can be clean. On a 60 Hz lamp, a 180° shutter does not remove it.',
    parts: [
      'The whole frame breathes, or a band rolls. The frequency depends on the lamp and the sample rate. One flicker filter does not cover both.',
      'Incandescent and magnetically ballasted lamps run at twice the mains: 100 Hz from 50 Hz, 120 Hz from 60 Hz. When exposure equals an integer number of lamp cycles, every row integrates the same amount and both whole-frame flicker and rolling bands disappear. When the sample rate divides the lamp frequency, every frame starts at the same phase, so the frame does not pulse; if the exposure is not an integer number of cycles, rolling-shutter bands freeze in place. Otherwise the alias is the absolute difference from the nearest multiple of the sample rate, folded into 0 to half the sample rate. See <TLink slug="mains" />.',
      'PAL, about 1/50 s for a field: a 100 Hz lamp divides evenly (100/50 = 2) and 1/50 s is two cycles, so it is clean. A 120 Hz lamp aliases to 20 Hz at a 50 Hz sample, and to 5 Hz once woven to 25 frames (120 − 5×25). At 25 fps, 150° (1/60 s) or 300° (1/30 s) is an integer exposure.',
      'Presets include PAL with 50 Hz lamps, PAL with 60 Hz lamps, 59.94, and 24 fps at 172.8° and 144°. The figure is the integral, not the lamp on this panel.',
      'An integer exposure at capture is avoidable-at-source. A finished shot that is one gain per frame can only be attenuated with deflicker. Bands written per row are already in the samples.',
      'Reshoot with the shutter or with a high-frequency lamp when you can. In post, use deflicker only after you know the flicker is a whole-frame gain.',
      'Do not aim deflicker at rolling bands, and do not call a tmix smear a repair.',
    ],
  },
})

add({
  id: 'slow-roll-5994', group: 'flicker', era: 'ntsc', removability: 'attenuate',
  tags: ['flicker', '5994'], related: ['light-beat', 'rolling-bands'],
  labWidgets: ['LightBeat'], recipeIds: ['deflicker-am'], displayCaveat: 'refresh',
  widget: '<LightBeat />',
  zh: {
    title: '59.94 对 60 Hz 灯', summary: '120 Hz 的灯对 59.94 场，大约 8.3 秒亮暗走一圈。',
    parts: [
      '横条或整幅亮度缓慢滚动，一圈大约数秒，不像 50 对 60 那样猛。',
      '120 − 2×(60000/1001) = 120/1001 ≈ 0.1199 Hz，周期约 8.3 秒。摄像机锁在整数 60 上时这个差是 0。同一台 59.94 的机器去拍 100 Hz 的灯（50 Hz 市电），拍频大约 20 Hz。见 <TLink slug="ntsc" />。',
      '在 LightBeat 里选 59.94 预设，看拍频读数。和 PAL+60 Hz 灯的 20 Hz 放在一起对比。',
      '滚动的是相位，不是屏幕刷新本身。',
      '整幅慢变化可以用长窗口的 deflicker 减轻，窗口要看得见这一圈，又不能把真正的灯光变化吃掉。按行的横条仍然写进样点。',
      '能锁相就锁到市电。后期只处理你确认是整幅增益的那一段。',
      '不要用很短的 deflicker 窗口去追 0.12 Hz，它看不见这一圈。',
    ],
  },
  en: {
    title: '59.94 against a 60 Hz lamp', summary: 'A 120 Hz lamp against 59.94 fields walks around in about 8.3 seconds.',
    parts: [
      'A bar or the whole frame drifts over several seconds. It is not the hard beat of 50 against 60.',
      '120 − 2×(60000/1001) = 120/1001 ≈ 0.1199 Hz, a period near 8.3 seconds. Lock the camera to integer 60 and the difference is zero. The same 59.94 camera on a 100 Hz lamp (50 Hz mains) aliases near 20 Hz. See <TLink slug="ntsc" />.',
      'Select the 59.94 preset and read the alias. Compare it with PAL on a 60 Hz lamp at 20 Hz.',
      'What rolls is phase, not this panel’s refresh.',
      'A slow whole-frame change can be attenuated with a long deflicker window: long enough to see the cycle, short of eating a real lighting change. Per-row bands are still in the samples.',
      'Lock to the mains when you can. In post, process only the stretch you have confirmed is a whole-frame gain.',
      'Do not chase 0.12 Hz with a very short deflicker window. It cannot see the cycle.',
    ],
  },
})

add({
  id: 'shutter-24', group: 'flicker', era: 'film', removability: 'prevent',
  tags: ['shutter', '24p'], related: ['light-beat', 'judder'],
  labWidgets: ['LightBeat'], recipeIds: [], displayCaveat: 'refresh',
  noRecipeReason: {
    zh: '172.8° 和 144° 是拍摄时的快门，不是成片上的滤镜。已经按 180° 拍完的整幅闪，见 deflicker。',
    en: '172.8° and 144° are capture shutters, not a filter on the finished file. Whole-frame flicker already shot at 180° is the deflicker entry.',
  },
  widget: '<LightBeat />',
  zh: {
    title: '24 帧在两种市电下的快门', summary: '50 Hz 地区用 172.8°。60 Hz 地区用 144°，180° 会把横条钉住。',
    parts: [
      '欧洲实景里 24 fps 会以大约 4 Hz 闪。北美实景里 180° 常常整幅不跳，但滚动快门上有一道不动的横条。',
      '100 Hz 灯除以 24 不是整数，拍频 4 Hz。172.8° 使曝光为 1/50 秒，等于两个 100 Hz 周期。120 Hz 灯除以 24 等于 5，每一帧起始相位相同，所以整幅不随时间跳；180° 曝光是 2.5 个周期，横条钉死。144° 是 1/60 秒，两个 120 Hz 周期，横条也消失。',
      '用 LightBeat 的四个 24 fps 预设对照拍频和「整数周期」读数。',
      '结论行会给出成片还能不能修。',
      '快门在拍摄时就对了：可以避免。180° 已拍完的钉死横条：写进样点。',
      '按地区选 172.8° 或 144°。',
      '不要以为 24 fps 高档就自动避开市电。',
    ],
  },
  en: {
    title: 'A 24-frame shutter on two mains', summary: 'Use 172.8° on 50 Hz mains. Use 144° on 60 Hz mains. 180° freezes the bands.',
    parts: [
      '24 fps practicals in Europe flicker near 4 Hz. In North America, 180° often does not pulse the whole frame, and a rolling shutter keeps a stationary band.',
      'A 100 Hz lamp divided by 24 is not an integer, so the alias is 4 Hz. 172.8° exposes for 1/50 s, two cycles of 100 Hz. A 120 Hz lamp divided by 24 is 5, so every frame starts at the same phase and the frame does not pulse. A 180° exposure is 2.5 cycles, and the bands freeze. 144° is 1/60 s, two cycles of 120 Hz, and the bands go away.',
      'Compare the four 24 fps presets and read the alias and the integer-cycle flag.',
      'The verdict line says whether the finished picture can still be repaired.',
      'The right shutter at capture is avoidable-at-source. Frozen bands already shot at 180° are in the samples.',
      'Pick 172.8° or 144° for the region.',
      'Do not assume 24 fps is automatically clear of the mains.',
    ],
  },
})

add({
  id: 'field-phase-lamps', group: 'flicker', era: 'interlace', removability: 'attenuate',
  tags: ['interlace', 'flicker'], related: ['light-beat', 'combing', 'deflicker'],
  labWidgets: ['LightBeat', 'FieldLoom'], recipeIds: ['deflicker-fields'], displayCaveat: 'crt',
  widget: '<FieldLoom view="lamp" />',
  zh: {
    title: '两场吃到不同的灯相位', summary: '整数周期时两场一样亮。不是整数时，奇偶行会交替明暗。',
    parts: [
      '编织之后像一层很淡的梳齿，或者 25 Hz 的行间明暗，物体本身没动。',
      'PAL 拍 100 Hz 灯、曝光 1/50 秒时，两场都盖住整数周期，积分相同，不会场间交替。PAL 拍 120 Hz 灯时，两场相差 1/50 秒，奇数行和偶数行吃到不同相位。',
      '逐场看亮度，物体边缘并不像运动梳齿那样位移。',
      '人停着。两场同亮时行是齐的。按下「奇偶行交替」，只有明暗在换，轮廓不错开。这是灯的相位，不是场序。拍频用 LightBeat 算。',
      '按场做整幅增益归一，只能减轻，而且会误伤真正的曝光变化。先编织再 deflicker 会把两场平均掉。',
      '配方先 separatefields，再 deflicker，再 weave。确认闪的是整场增益，不是横条。',
      '不要把这种淡梳齿送给 yadif，也不要在编织后的帧上直接 deflicker。',
    ],
  },
  en: {
    title: 'Two fields, two lamp phases', summary: 'Integer cycles make both fields equally bright. Otherwise odd and even lines alternate.',
    parts: [
      'After a weave it looks like a faint comb, or a 25 Hz shimmer between lines, and the object has not moved.',
      'PAL on a 100 Hz lamp with a 1/50 s exposure covers an integer number of cycles in both fields, so the integrals match. PAL on a 120 Hz lamp spaces the fields by 1/50 s, and odd and even lines see different phases.',
      'Step the fields and look at brightness. The edge has not shifted the way a motion comb shifts.',
      'The person is still. Matching fields stay even. Press “Lines alternate” and only the brightness changes; the outline does not split. This is lamp phase, not field order. Compute the beat in LightBeat.',
      'Per-field gain normalization only attenuates, and it will eat a real exposure change. deflicker after the weave averages the two fields together.',
      'The recipe is separatefields, then deflicker, then weave. Confirm the flicker is a whole-field gain, not a band.',
      'Do not send this faint comb to yadif, and do not deflicker the woven frame.',
    ],
  },
})

add({
  id: 'area-and-twitter', group: 'interlace', era: 'crt', removability: 'attenuate',
  tags: ['crt', 'twitter'], related: ['combing', 'psf-vs-adjacent'],
  labWidgets: ['Raster'], recipeIds: [], displayCaveat: 'crt',
  noRecipeReason: {
    zh: '显像管上的大面积场闪是显示刷新，不是样点里的增益。细横线的行间闪烁来自「只活在一场」。后期去隔行或垂直低通只能减轻文件里的行间结构，不能把 50 Hz 的 CRT 变成 100 Hz。',
    en: 'Large-area field flicker on a CRT is the display, not a gain in the samples. Interline twitter is a detail that lives in one field. Deinterlace or a vertical lowpass can only soften that structure in the file. It cannot turn a 50 Hz CRT into 100 Hz.',
  },
  widget: '<Raster />',
  zh: {
    title: '大面积闪烁与行间闪烁', summary: '场频决定大面积闪。只活在一场里的细线按帧频闪。',
    parts: [
      '大块灰区在 50 场的显像管上比 60 场更闪。细的水平线自己在跳，竖边并不梳。',
      '隔行用场频换大面积闪烁，用帧频换细线的刷新。PsF 在 CRT 上也会行间闪，因为细线仍然只在一场里画。这不是灯的拍频，所以不走 deflicker。',
      '齿跟着运动走，是梳齿。细线在静止画面里跳，是行间闪烁。',
      '光栅图只说明行场，不能在这块液晶上放出 50 Hz。',
      'CRT 观感无法后期消除。文件里的一场细节可以用 bob 或 bwdif 换成场率刷新，垂直分辨率下降。',
      '若问题在文件里的隔行结构，去 <PLink id="yadif-bwdif" />。若问题只在显像管上，换显示器。',
      '不要对行间闪烁跑 deflicker。',
    ],
  },
  en: {
    title: 'Large-area flicker and interline twitter', summary: 'Field rate sets large-area flicker. A line that lives in one field flickers at frame rate.',
    parts: [
      'A flat gray area flickers harder on a 50-field CRT than on a 60-field CRT. A thin horizontal line shimmers on its own, and vertical edges do not comb.',
      'Interlace buys large-area flicker at field rate and refreshes fine lines at frame rate. PsF twitters on a CRT too, because a thin line is still drawn in one field. This is not a lamp beat, so it is not a deflicker job.',
      'Teeth that follow motion are combing. A fine line that shimmers in a still is twitter.',
      'The raster explains lines and fields. It cannot emit 50 Hz from this LCD.',
      'The CRT sensation cannot be removed in post. Detail that exists in one field of the file can be shown at field rate with bob or bwdif, and vertical resolution drops.',
      'If the structure is in the file, go to <PLink id="yadif-bwdif" />. If it exists only on the CRT, change the display.',
      'Do not run deflicker on interline twitter.',
    ],
  },
})

add({
  id: 'rolling-bands', group: 'flicker', era: 'camera', removability: 'baked',
  tags: ['rolling-shutter'], related: ['light-beat', 'deflicker', 'tmix'],
  labWidgets: ['LightBeat'], recipeIds: [], displayCaveat: 'refresh',
  noRecipeReason: {
    zh: 'FFmpeg 没有按行跟踪灯相位的滤镜。deflicker 只归一整帧亮度。tmix 用拖影换一点幅度，横条还在。',
    en: 'FFmpeg has no filter that tracks lamp phase per row. deflicker normalizes whole-frame luma. tmix trades smear for a little amplitude, and the bands remain.',
  },
  widget: '<LightBeat />',
  zh: {
    title: '滚动快门横条', summary: '每一行的曝光窗口错开。成片里的横条消不干净。',
    parts: [
      '明暗带横在画面上。锁相时钉住，拍频不是零时会滚。',
      '滚动快门让每一行的积分起点不同。整数个灯周期时，起点无所谓，横条消失。否则每一行有自己的增益。这是拍摄结构，不是后期的一个全局乘数。',
      '在 LightBeat 里切到滚动快门。整数曝光时右图变平；不是整数时出现横带。',
      '右图是行延迟后的积分。',
      '已经写进样点。拍摄时把曝光改成整数周期可以避免。',
      '重拍，或接受横条。',
      '不要把 deflicker 的输出当成横条已经移除。',
    ],
  },
  en: {
    title: 'Rolling-shutter bands', summary: 'Each row’s exposure window is delayed. Bands in the finished picture do not come out cleanly.',
    parts: [
      'Light and dark bands lie across the frame. They freeze when the rates lock, and they roll when the alias is not zero.',
      'A rolling shutter gives every row a different integration start. An integer number of lamp cycles makes the start irrelevant, and the bands disappear. Otherwise each row has its own gain. That is capture structure, not one global multiplier for post.',
      'Switch LightBeat to a rolling shutter. An integer exposure flattens the right-hand image. Anything else shows bands.',
      'The right-hand image is the integral after a per-row delay.',
      'Already in the samples. An integer exposure at capture would have avoided it.',
      'Reshoot, or keep the bands.',
      'Do not read a deflicker output as proof the bands are gone.',
    ],
  },
})

add({
  id: 'judder', group: 'progressive', era: 'film', removability: 'attenuate',
  tags: ['judder', '24p'], related: ['ivtc-vs-deinterlace', 'mixed-cadence'],
  labWidgets: ['Pulldown'], recipeIds: ['fieldmatch-decimate'], displayCaveat: 'diagram',
  widget: '<Pulldown />',
  zh: {
    title: '胶片抖动与重复帧', summary: '3:2 的顿是节拍本身。插帧会另造痕迹。',
    parts: [
      '运动按固定节拍顿一下，常是两帧、三帧的重复，不是随机掉帧。',
      '24 格放在 60 场上，有的格占两场、有的占三场。眼睛看到的是不均匀的时间。PAL 加速到 25 再 2:2，则是匀速，但比原片快 4%。',
      'Pulldown 里 BC、CD 是混合帧，AA、BB、DD 是重复。样片 telecine-23 的亮条会停在重复的位置。',
      '下拉图逐步标出重复场。',
      '把 3:2 还原成胶片格，节拍可以回到 24p，这是还原。把 24p 再插成 60p，运动是估计出来的，只能减轻顿的感觉，会留下插值痕迹。',
      '重复场用 fieldmatch 和 decimate。确认不是真隔行。',
      '不要用 minterpolate 把电影的 24 格「修顺」当作无损失。',
    ],
  },
  en: {
    title: 'Film judder and repeated frames', summary: 'The 3:2 hitch is the cadence. Interpolation invents a different artifact.',
    parts: [
      'Motion hitches on a fixed beat, usually a two-frame and three-frame repeat, not a random drop.',
      '24 frames on 60 fields hold some frames for two fields and some for three. The eye sees uneven time. PAL sped up to 25 and split 2:2 is even, and 4% fast.',
      'In the pulldown figure, BC and CD are mixed frames. AA, BB, and DD are repeats. The bar in telecine-23 pauses where the repeat is.',
      'Step the figure and mark the repeated fields.',
      'Undoing 3:2 back to film frames is reversible. Interpolating 24p up to 60p estimates motion, only softens the hitch, and leaves interpolation traces.',
      'Repeated fields take fieldmatch and decimate. Confirm it is not real interlace.',
      'Do not treat minterpolate as a lossless way to smooth 24-frame film.',
    ],
  },
})

add({
  id: 'deflicker', group: 'flicker', era: 'digital', removability: 'attenuate',
  tags: ['deflicker'], related: ['light-beat', 'rolling-bands', 'tmix', 'field-phase-lamps'],
  labWidgets: ['TemporalWindow', 'FrameCompare'], recipeIds: ['deflicker-am'], displayCaveat: 'diagram',
  widget: '<TemporalWindow />\n\n<FrameCompare samples="flicker-global,flicker-global-deflicker,flicker-bands,flicker-bands-deflicker" />',
  zh: {
    title: 'deflicker', summary: '按时间把整帧亮度拉向窗口均值。横条拉不平。',
    parts: [
      '延时摄影或整幅闪的镜头，亮度起伏变小。运动大的镜头会跟着被拉平。横条还在。',
      '滤镜用最近若干帧的亮度统计（默认算术平均，窗口默认 5，最大 129）估计这一帧该有的亮度，再做整帧增益。它分不清「灯在闪」和「画面真的亮了」。',
      '样片前两格是 4 Hz 的整幅闪和 deflicker 之后。后两格是带横条的同一处理，横条还在。',
      '停在灯最暗的一帧。窗越长，灯和屋子越靠近平均，人影越长。横条还在。',
      '只能减轻。误伤真实光变是这个档位的理由。',
      '整幅增益、运动不大时用 `deflicker=size=9:mode=am`。隔行两场相位不同要先按场做。',
      '不要用在滚动横条上，也不要开很大的窗口去修一段真正在变暗的戏。',
    ],
  },
  en: {
    title: 'deflicker', summary: 'Pulls whole-frame luma toward a temporal window. It does not flatten bands.',
    parts: [
      'Timelapse or whole-frame flicker gets flatter. A shot with large motion gets flattened too. Bands remain.',
      'The filter estimates the luma this frame should have from recent frames (arithmetic mean by default, window 5, maximum 129) and applies one gain. It cannot tell a flickering lamp from a scene that really got brighter.',
      'The first pair is a 4 Hz whole-frame flicker and the same frames after deflicker. The second pair is the same filter on bands. The bands remain.',
      'Held on the lamp’s darkest frame. A longer window pulls the lamp and the room toward the average and lengthens the ghosts. The bands stay.',
      'Attenuation only. Eating a real exposure change is why it sits in that grade.',
      'Use `deflicker=size=9:mode=am` for a whole-frame gain with little motion. If the two fields see different lamp phases, process fields first.',
      'Do not use it on rolling bands, and do not open a huge window on a scene that is actually going dark.',
    ],
  },
})

add({
  id: 'tmix', group: 'flicker', era: 'digital', removability: 'attenuate',
  tags: ['tmix'], related: ['deflicker', 'rolling-bands'],
  labWidgets: ['TemporalWindow', 'FrameCompare'], recipeIds: ['tmix-frames'], displayCaveat: 'diagram',
  widget: '<TemporalWindow />\n\n<FrameCompare samples="flicker-global,flicker-global-tmix" />',
  zh: {
    title: 'tmix', summary: '把连续几帧混在一起。闪会变小，运动会拖尾。',
    parts: [
      '快速的整幅闪变钝，运动物体后面拖着残影。横条只是变淡，并不消失。',
      'tmix 是帧混合，不是亮度归一。窗口里的每一帧都留在画面上，所以拖影长度跟着帧数走。',
      '对照整幅闪和 tmix 之后的样片。拖影在时间窗的橙色块上能看见同一件事。',
      '滑动窗长。',
      '只能减轻，代价是运动。',
      '只在你接受拖影时使用，例如 `tmix=frames=5`。',
      '不要把 tmix 当成 deflicker 的更强版本，也不要靠它清除横条。',
    ],
  },
  en: {
    title: 'tmix', summary: 'Mixes successive frames. Flicker shrinks and motion trails.',
    parts: [
      'Fast whole-frame flicker dulls, and moving objects leave a trail. Bands only get fainter. They do not disappear.',
      'tmix is a frame mix, not a luma normalization. Every frame in the window stays in the picture, so the trail grows with the frame count.',
      'Compare the whole-frame flicker with the tmix stills. The orange block in the temporal window is the same smear.',
      'Move the window length.',
      'Attenuation only, paid for with motion.',
      'Use it when you accept the trail, for example `tmix=frames=5`.',
      'Do not treat tmix as a stronger deflicker, and do not use it to clear bands.',
    ],
  },
})

add({
  id: 'mixed-cadence', group: 'progressive', era: 'film', removability: 'attenuate',
  tags: ['cadence'], related: ['ivtc-vs-deinterlace', 'judder', 'combing'],
  labWidgets: ['Pulldown'], recipeIds: [], displayCaveat: 'diagram',
  noRecipeReason: {
    zh: '没有一条命令能同时反电视电影和去隔行。必须按镜头切开，胶片段走 fieldmatch/decimate，视频段走 bwdif。',
    en: 'No single command both inverse-telecines and deinterlaces. Split by shot. Film shots take fieldmatch/decimate. Video shots take bwdif.',
  },
  widget: '<Pulldown />',
  zh: {
    title: '混合节拍', summary: '一段胶片、一段视频时，不要整段用同一个 IVTC。',
    parts: [
      '有的镜头顿得有规律，有的镜头是正常的 50 场或 60 场运动，硬套 3:2 之后那些镜头被抽帧。',
      '同一条母带可以在胶片下拉和摄像机隔行之间切换。节拍不是文件级属性。',
      '分段看 idet，也分段看重复帧。整段一个模式报告，不能代表每个镜头。',
      '下拉图只解释胶片那一段。',
      '切开之后，各段仍按自己的档位处理。整段一个滤镜会把其中一种片源写坏。',
      '按镜头切。胶片用 <PLink id="ivtc-vs-deinterlace" />，视频用 <PLink id="yadif-bwdif" />。',
      '不要对整段 fieldmatch 再 decimate。',
    ],
  },
  en: {
    title: 'Mixed cadence', summary: 'When one shot is film and the next is video, do not IVTC the whole file.',
    parts: [
      'Some shots hitch on a regular beat. Others are ordinary 50-field or 60-field motion. Forcing 3:2 drops frames out of those shots.',
      'One master can switch between film pulldown and camera interlace. Cadence is not a file-level property.',
      'Read idet per shot, and look for repeated frames per shot. One pattern report for the whole file does not describe every shot.',
      'The pulldown figure explains only the film stretch.',
      'After the split, each stretch keeps its own grade. One filter on the whole file bakes the damage into one of the sources.',
      'Cut by shot. Film uses <PLink id="ivtc-vs-deinterlace" />. Video uses <PLink id="yadif-bwdif" />.',
      'Do not fieldmatch and decimate the entire timeline.',
    ],
  },
})

for (const entry of P) writePhenomenon(entry)
console.log('wrote', P.length, 'flicker phenomena')
