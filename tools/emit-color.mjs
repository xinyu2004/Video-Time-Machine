import { writePhenomenon } from './phlib.mjs'

const P = []
const add = (e) => P.push(e)

add({
  id: 'standard-names', group: 'color', era: 'digital', removability: 'prevent',
  tags: ['naming'], related: ['bt601-sampling', 'matrices', 'primaries'],
  labWidgets: [], recipeIds: [], displayCaveat: 'diagram',
  noRecipeReason: {
    zh: '这是文件名对照，没有要跑的滤镜。',
    en: 'This is a naming note. There is no filter to run.',
  },
  widget: '',
  zh: {
    title: 'CCIR、ITU-R、Rec. 与 BT.', summary: '601 换过机构信头。Rec.709 和 BT.709 是同一份建议书。',
    parts: [
      '四个名字叠在一起时，像四代画面。其实只有建议书在改版，机构在改名。',
      '1982 年 CCIR Recommendation 601。1992 年 CCIR 并入 ITU-R，电视建议书用 BT 编号。CCIR 601 继续出版为 ITU-R BT.601。Rec.709 就是 BT.709，Rec.2020 就是 BT.2020。见 <TLink slug="bt601" /> 和 <TLink slug="hd-uhd" />。',
      '引用时写出编号和修订（例如 BT.601-7），不要发明「ITU-R 制」。',
      '这一页没有实验室。色度三角形在 <PLink id="primaries" />。',
      '叫错名字不会损伤样点。按错误的文件去转换，才会。',
      '正文里滤镜名保持 FFmpeg 的枚举：bt470bg、smpte170m、bt709、bt2020ncl。不要写「bt601 滤镜等于整份 CCIR 601」。',
      '不要把 BT.2020 当成 HDR 的名字。HDR 曲线在 BT.2100。',
    ],
  },
  en: {
    title: 'CCIR, ITU-R, Rec., and BT.', summary: '601 changed letterhead. Rec.709 and BT.709 are one recommendation.',
    parts: [
      'Four names stacked together look like four generations of picture. The recommendations were revised, and the institution was renamed.',
      'CCIR Recommendation 601 is from 1982. In 1992 CCIR was absorbed into ITU-R, and television recommendations use BT numbers. CCIR 601 continued as ITU-R BT.601. Rec.709 is BT.709. Rec.2020 is BT.2020. See <TLink slug="bt601" /> and <TLink slug="hd-uhd" />.',
      'Cite the number and the revision (for example BT.601-7). Do not invent an “ITU-R format”.',
      'This page has no lab. The triangles are on <PLink id="primaries" />.',
      'A wrong name does not damage samples. Converting according to the wrong document does.',
      'Keep FFmpeg’s enum names in the commands: bt470bg, smpte170m, bt709, bt2020ncl. Do not write that the bt601 filter equals the whole of CCIR 601.',
      'Do not use BT.2020 as the name of HDR. The HDR curves are in BT.2100.',
    ],
  },
})

add({
  id: 'bt601-sampling', group: 'color', era: 'sd', removability: 'prevent',
  tags: ['601'], related: ['standard-names', 'pixel-aspect', 'levels', 'interlaced-chroma'],
  labWidgets: ['DividerChain'], recipeIds: [], displayCaveat: 'diagram',
  noRecipeReason: {
    zh: '13.5 MHz 和 720 样点是采样规格。成片里改不回模拟行周期。幅面和矩阵的处理见相邻词条。',
    en: '13.5 MHz and 720 samples are the sampling spec. A finished file cannot grow its analog line period back. Raster and matrix repairs live on the neighboring entries.',
  },
  widget: '<DividerChain />',
  zh: {
    title: 'BT.601 怎么采样', summary: '13.5 MHz，每行 720 个亮度样点，4:2:2，Y 从 16 到 235。',
    parts: [
      '标清数字的网格是固定的：宽 720，625 制高 576，525 制常见 486 或 480。',
      '亮度钟 13.5 MHz 同时服务两种行频。525 彩色每行 858 个时钟，625 每行 864 个，有效样点都取 720。4:2:2 的色差是 6.75 MHz。4:2:0 不在 601 里。8 bit 演播范围是 Y 16–235、色差 16–240。见 <TLink slug="bt601" />。',
      'ffprobe 看 width、height、sample_aspect_ratio，不要只看显示宽高比。',
      '分频链说明 525 和 625 的行频从哪来。采样钟是后加在这个行频上的。',
      '网格本身是规格。把 720 当成方像素再放大，是另一条词条里的损失。',
      '按 601 的有效样点和范围解释文件，再决定要不要 setsar 或 colorspace。',
      '不要把 4:2:0 的光盘格式叫成「601 的采样」。',
    ],
  },
  en: {
    title: 'How BT.601 samples', summary: '13.5 MHz, 720 luma samples per active line, 4:2:2, Y from 16 to 235.',
    parts: [
      'The SD digital grid is fixed: 720 wide, 576 high for 625-line, and commonly 486 or 480 for 525-line.',
      'A 13.5 MHz luma clock serves both line rates. A 525 color line has 858 clocks, a 625 line has 864, and both keep 720 active samples. 4:2:2 color-difference is 6.75 MHz. 4:2:0 is not in 601. 8-bit studio range is Y 16–235 and chroma 16–240. See <TLink slug="bt601" />.',
      'Read width, height, and sample_aspect_ratio in ffprobe. Do not stop at the display aspect.',
      'The divider chain shows where the 525 and 625 line rates come from. The sampling clock was added on top of that rate.',
      'The grid is the specification. Treating 720 samples as square and scaling them is a loss described on another page.',
      'Interpret the file with 601’s active samples and range, then decide whether you need setsar or colorspace.',
      'Do not call a 4:2:0 disc format “601 sampling”.',
    ],
  },
})

add({
  id: 'matrices', group: 'color', era: 'digital', removability: 'invert',
  tags: ['matrix'], related: ['primaries', 'levels', 'tag-2020-content-709'],
  labWidgets: ['GamutStack', 'FrameCompare'], recipeIds: ['colorspace-convert', 'setparams-retag'], displayCaveat: 'diagram',
  widget: '<GamutStack view="matrix" />\n\n<FrameCompare samples="bars-tag,bars-709-as-601,bars-709-as-2020" />',
  zh: {
    title: '三套矩阵', summary: '601 是 0.299/0.587/0.114。709 是 0.2126/0.7152/0.0722。2020 是 0.2627/0.6780/0.0593。',
    parts: [
      '红衣服、肤色、蓝墙的 R、G、B 变了。编码用的亮度行和解码用的不是同一次解。',
      '亮度行怎么从基色和白点解出来，见 <TLink slug="hd-uhd" />。用 601 的行解开按 709 的行编的 Y′CbCr，等于拿 1953 年的解去解 1990 年的解。FFmpeg 里 601 这组系数常叫 bt470bg（625）或 smpte170m（525）：两套荧光粉，接口仍是 0.299 / 0.587 / 0.114。2020 的非恒定亮度叫 bt2020ncl。`setparams` 只改标签。`colorspace` 或 `zscale` 才改样点。',
      '选输入和输出。看红衣服、肤色、蓝墙。红衣服写红的权重和 R、G、B，蓝墙写蓝的权重和 R、G、B。同一套时左右一样。样片 bars-tag 是只换标签，另外两张是真转换。',
      '三块色跟着这两次解走。只改标签时样点不动。同一景物的宽窄在 <PLink id="primaries" />。曲线是另一页。',
      '只标错、数值仍是原矩阵：可以还原，把标签改回去。已经按错误矩阵算过并重新编码：写进样点。',
      '确认数值和标签哪一个是错的。要改数值时用 colorspace 的 iall 和 all。',
      '不要用 setparams 冒充转换，也不要写「FFmpeg 的 bt601 等于整份 CCIR 601」。',
    ],
  },
  en: {
    title: 'Three matrices', summary: '601 is 0.299/0.587/0.114. 709 is 0.2126/0.7152/0.0722. 2020 is 0.2627/0.6780/0.0593.',
    parts: [
      'R, G, and B on the red shirt, the skin, and the blue wall move. The luma row used to encode and the row used to decode are not the same solution.',
      'How the luma row is solved from primaries and white is on <TLink slug="hd-uhd" />. Decoding Y′CbCr that was encoded with the 709 row by using the 601 row applies the 1953 solution to the 1990 solution. In FFmpeg those 601 weights are usually bt470bg (625) or smpte170m (525): two phosphor sets, and the interface is still 0.299 / 0.587 / 0.114. 2020 non-constant luminance is bt2020ncl. `setparams` only retags. `colorspace` or `zscale` changes samples.',
      'Choose an input and an output. Read the red shirt, the skin, and the blue wall. The shirt states the red weight and R, G, B. The wall states the blue weight and R, G, B. The same pair matches on both sides. bars-tag is a retag. The other stills are real conversions.',
      'The three chips follow the two solutions. A retag does not move the samples. The wide and narrow columns of one scene are on <PLink id="primaries" />. The curve is another page.',
      'A wrong tag on the original numbers is reversible: put the tag back. A file already converted with the wrong matrix and re-encoded is in the samples.',
      'Decide whether the numbers or the tag are wrong. To change numbers, set colorspace iall and all.',
      'Do not let setparams impersonate a conversion, and do not write that FFmpeg’s bt601 equals CCIR 601.',
    ],
  },
})

add({
  id: 'primaries', group: 'color', era: 'digital', removability: 'invert',
  tags: ['primaries'], related: ['matrices', 'tag-2020-content-709', 'transfer-curves'],
  labWidgets: ['GamutStack'], recipeIds: ['colorspace-convert'], displayCaveat: 'diagram',
  widget: '<GamutStack view="primaries" />',
  zh: {
    title: '三基色', summary: '五套基色叠在一张色度图上。宽窄两列看同一景物里绿收回去多少。',
    parts: [
      '同一景物里，2020 能命名的绿落到这块屏幕上会收回来。肤色两边都能放下。',
      '五套基色、白点和亮度行的解在 <TLink slug="hd-uhd" />。sRGB 的三基色就是 709。',
      '点名字，三角形加粗。SMPTE-C 是 525 行监视器后来的粉，EBU 是 625 行演播监视器的粉，709 紧挨着 EBU，2020 的绿在光谱上。',
      '下面两列把这块屏幕当作 2020，再按 709 原色在 2020 坐标里能走到的比例缩小。绿会收回来，肤色两边一样。真正的 2020 比这块屏幕更宽。',
      '标签与数值一致时，转换到另一套三基色是有定义的颜色运算。标签写错但数值没被改过，改回标签即可。',
      '要换三基色时让 colorspace 连 primaries 一起转，不要只换 matrix。',
      '不要把 2020 的三角形当成「更正确的 709」。它们是两套原色。',
    ],
  },
  en: {
    title: 'Primaries', summary: 'Five primary sets on one diagram. The two columns show how far green comes back on one scene.',
    parts: [
      'On one scene, a green that 2020 can name comes back in on this screen. Skin fits on both sides.',
      'The five primary sets, the white points, and the solved luma rows are on <TLink slug="hd-uhd" />. sRGB primaries are the 709 primaries.',
      'A name thickens that triangle. SMPTE-C is the later phosphor of 525-line monitors. EBU is the studio phosphor of 625-line plants. 709 sits against EBU. The 2020 green is on the spectrum.',
      'The two columns below treat this screen as 2020, then shrink by how far the 709 primaries reach inside 2020 coordinates. Green comes back in, and skin matches. Real 2020 is wider than this screen.',
      'When tag and numbers agree, converting to another primary set is a defined color transform. A wrong tag on untouched numbers is fixed by restoring the tag.',
      'When you change primaries, let colorspace convert primaries together with the matrix. Do not change only the matrix.',
      'Do not treat the 2020 triangle as a more correct 709. They are two sets of primaries.',
    ],
  },
})

add({
  id: 'transfer-curves', group: 'color', era: 'digital', removability: 'invert',
  tags: ['gamma', 'srgb'], related: ['primaries', 'levels', 'bt2100-boundary'],
  labWidgets: ['ToneMap'], recipeIds: ['transfer-srgb'], displayCaveat: 'diagram',
  widget: '<ToneMap />',
  zh: {
    title: '三条曲线', summary: '709 是摄像机曲线。1886 是显示伽马。sRGB 三基色相同，曲线和范围不同。',
    parts: [
      '同一文件在视频监视器和网页上看，暗部不一样。有的发灰，有的发闷。',
      'BT.709 的 OETF 是拍摄端的分段曲线，亮部大约 0.45 次方。BT.1886 是参考显示器的 EOTF，大约 2.4。sRGB 抄了 709 的三基色，传输曲线是另一组常数，并且使用 0–255。三件事不是一条伽马。',
      'ffprobe 的 color_transfer 是标签。color_range 是另一栏。',
      '看暗部。滑块是次数，2.2 和 2.4 是两个刻度。sRGB 在接近黑的地方是另一段，不在滑块上。看 color_transfer，不要看矩阵系数。',
      '只标错曲线、样点仍按原曲线编码：可以还原标签。已经用错误曲线改过码值：写进样点。',
      '视频和 sRGB 之间要用 colorspace 的 trc，连范围一起考虑。',
      '不要把 2.2 和 2.4 当成同一种「伽马」随便互换，也不要把这条曲线换成 PQ。',
    ],
  },
  en: {
    title: 'Three curves', summary: '709 is the camera curve. 1886 is the display gamma. sRGB shares the primaries and not the curve or the range.',
    parts: [
      'The same file looks different in the shadows on a video monitor and in a browser. One is gray, the other is dull.',
      'The BT.709 OETF is the camera’s piecewise curve, about a 0.45 power in the highlights. BT.1886 is the reference display EOTF, about 2.4. sRGB copied the 709 primaries, uses a different set of constants, and uses 0–255. Those are not one gamma.',
      'ffprobe color_transfer is a tag. color_range is a different field.',
      'Look at the shadows. The slider is a power. 2.2 and 2.4 are two marks. sRGB is a different piece near black, and it is not on the slider. Read color_transfer, not the matrix weights.',
      'A wrong curve tag on samples that still follow the original curve is reversible. Code values already passed through the wrong curve are in the samples.',
      'Between video and sRGB, set colorspace trc and account for range.',
      'Do not swap 2.2 and 2.4 as if they were one gamma, and do not replace this curve with PQ.',
    ],
  },
})

add({
  id: 'tag-2020-content-709', group: 'color', era: 'uhd', removability: 'invert',
  tags: ['2020'], related: ['primaries', 'matrices', 'bt2100-boundary'],
  labWidgets: ['GamutStack'], recipeIds: ['setparams-retag'], displayCaveat: 'diagram',
  widget: '<GamutStack view="matrix" />',
  zh: {
    title: '2020 标签里的 709 内容', summary: '交付规格要求标 2020 时，分级仍可能全部落在 709 三角形里。',
    parts: [
      '按 2020 三基色去转换之后，颜色突然过饱和。按 709 显示时，反倒正常。',
      '标签和内容可以不一致。BT.2020 允许的色域很大，不表示这一个文件用满了它。见 <TLink slug="hd-uhd" />。',
      '看分级时的工作色域，不只看容器标签。把文件按 709 和按 2020 各解一次，比较皮肤。',
      '这里的两个选择只换亮度行。只改标签时三块色不动。同一景物的宽窄在 <PLink id="primaries" />，五套基色在 <TLink slug="hd-uhd" />。',
      '数值本来就是 709、只是标签写成 2020：可以还原，把标签改回 709。已经按满色域矩阵算过并重编码：写进样点。',
      '确认内容色域之后再用 setparams 改标签，或用 colorspace 做真正的原色转换。两件事不要混。',
      '不要看见 bt2020 就做 709→2020 的饱和扩展。',
    ],
  },
  en: {
    title: '709 content inside a 2020 tag', summary: 'A delivery spec can require a 2020 tag while the grade still sits inside the 709 triangle.',
    parts: [
      'Converted as 2020 primaries, the picture suddenly oversaturates. Shown as 709, it looks ordinary.',
      'Tag and content can disagree. BT.2020 allows a large gamut. This file need not fill it. See <TLink slug="hd-uhd" />.',
      'Read the grading gamut, not only the container tag. Decode once as 709 and once as 2020 and compare skin.',
      'These two choices change only the luma row. A retag leaves the three chips alone. The wide and narrow columns of one scene are on <PLink id="primaries" />. The five primary sets are on <TLink slug="hd-uhd" />.',
      'Numbers that are 709 with a 2020 tag are reversible: put the tag back. A file already run through a full-gamut matrix and re-encoded is in the samples.',
      'After you know the content gamut, use setparams to retag, or colorspace to convert primaries. Do not mix the two.',
      'Do not expand saturation 709→2020 just because the tag says bt2020.',
    ],
  },
})

add({
  id: 'bt2100-boundary', group: 'color', era: 'hdr', removability: 'prevent',
  tags: ['hdr', 'pq', 'hlg'], related: ['tag-2020-content-709', 'transfer-curves', 'primaries'],
  labWidgets: ['ToneMap'], recipeIds: [], displayCaveat: 'diagram',
  noRecipeReason: {
    zh: 'PQ 和 HLG 的色调映射不在本期配方里。要换的是曲线，不是再套一次 2020 矩阵。',
    en: 'PQ and HLG tone mapping is not a recipe in this pass. What changes is the curve, not another 2020 matrix.',
  },
  widget: '<ToneMap kind="pq" />',
  zh: {
    title: 'BT.2100 的边界', summary: '2020 加 SDR 曲线、2020 加 PQ、2020 加 HLG，是三种文件。',
    parts: [
      '标着 2020 的 HDR 片，直接当 709 伽马去看，亮部糊成一片或暗部死黑。',
      'BT.2020 的曲线仍是 SDR 的摄像机曲线，只是位深更高、三基色更宽。BT.2100 沿用 2020 的色容器，把曲线换成 PQ（SMPTE ST 2084）或 HLG。峰值亮度是曲线的事。',
      'ffprobe 的 color_transfer 出现 smpte2084 或 arib-std-b67 时，不是 bt709 那条曲线。color_primaries 仍可能是 bt2020。',
      '看亮窗。滑块是这扇窗的尼特，100、1000、4000 是刻度。从 100 拉到 1000，按 PQ 看会顶满，按伽马看只是更白一点。PQ（Perceptual Quantizer，SMPTE ST 2084）不是伽马滑块上的一个点。HLG 这里不画。这不是色调映射配方。',
      '认错曲线再转换，会把码值写坏。本期不提供色调映射配方，避免做成半套 HDR。',
      '先分开三基色和曲线。SDR 矩阵走 <PLink id="matrices" />。HDR 另立项目再写。',
      '不要用 colorspace=all=bt2020 把 PQ 当成已经变成 SDR。',
    ],
  },
  en: {
    title: 'The BT.2100 boundary', summary: '2020 with an SDR curve, 2020 with PQ, and 2020 with HLG are three files.',
    parts: [
      'An HDR picture tagged 2020, read as 709 gamma, blows the highlights or crushes the shadows.',
      'BT.2020’s curve is still the SDR camera curve, at higher bit depth and wider primaries. BT.2100 keeps the 2020 container and replaces the curve with PQ (SMPTE ST 2084) or HLG. Peak luminance belongs to the curve.',
      'When ffprobe color_transfer says smpte2084 or arib-std-b67, the curve is not bt709. color_primaries may still say bt2020.',
      'Look at the bright window. The slider is that window in nits, with marks at 100, 1000, and 4000. From 100 to 1000, PQ view hits the top and gamma view only gets a little whiter. PQ (Perceptual Quantizer, SMPTE ST 2084) is not a point on the gamma slider. HLG is not drawn here. This is not a tone-map recipe.',
      'Converting under the wrong curve writes bad code values. This pass does not ship a tone-map recipe, so HDR is not a half-finished feature.',
      'Separate primaries from the curve. SDR matrices are <PLink id="matrices" />. HDR can be its own project.',
      'Do not treat colorspace=all=bt2020 as a finished PQ-to-SDR conversion.',
    ],
  },
})

add({
  id: 'levels', group: 'color', era: 'digital', removability: 'invert',
  tags: ['range'], related: ['matrices', 'bt601-sampling', 'transfer-curves'],
  labWidgets: ['FrameCompare'], recipeIds: ['range-scale'], displayCaveat: 'diagram',
  widget: '<FrameCompare samples="bars-limited-ok,bars-limited-as-full" />',
  zh: {
    title: '演播范围和全幅', summary: '601 和 709 的 8 bit 黑是 16、白是 235。10 bit 是 64 到 940。',
    parts: [
      '发灰：黑抬起来，白不白。发黑：对比过重，暗部死掉。',
      '演播范围把 0 和 255 留给接口。计算机图形常用 0–255。把 16–235 当成 0–255 来显示，黑是 16，看起来发灰。把 0–255 当成 16–235 再拉伸，会裁掉两端。',
      'ffprobe 的 color_range 是 tv 或 pc。样片一是按演播范围正确展开，二是把演播数据当成全幅留下。',
      '两张是同一张黑底和人。按演播范围展开后，黑是黑。当成全幅留下时，黑发灰。',
      '只标错范围、码值仍是原来的法律范围：可以还原。已经拉伸或裁切再编码：写进样点。',
      '用 scale 的 in_range 和 out_range，或 colorspace 的 range。确认源到底是 tv 还是 pc。',
      '不要为了「更亮」把 limited 再拉一次。',
    ],
  },
  en: {
    title: 'Studio range and full range', summary: 'In 8-bit 601 and 709, black is 16 and white is 235. In 10-bit, 64 to 940.',
    parts: [
      'Gray: black is lifted and white is not white. Crushed: contrast is heavy and the shadows die.',
      'Studio range reserves 0 and 255 for the interface. Computer graphics often use 0–255. Displaying 16–235 as 0–255 leaves black at 16, so the picture looks gray. Stretching 0–255 as if it were 16–235 clips both ends.',
      'ffprobe color_range is tv or pc. The first still expands studio range correctly. The second leaves studio data in place as if it were full range.',
      'Both frames are one black field and one person. Expanded as studio range, black is black. Left as full range, black stays gray.',
      'A wrong range tag on legal code values is reversible. A file already stretched or clipped and re-encoded is in the samples.',
      'Use scale in_range and out_range, or colorspace range. Confirm whether the source is tv or pc.',
      'Do not stretch limited a second time to make it “brighter”.',
    ],
  },
})

add({
  id: 'chroma-siting', group: 'color', era: 'digital', removability: 'attenuate',
  tags: ['chroma'], related: ['interlaced-chroma', 'matrices'],
  labWidgets: [], recipeIds: ['chroma-loc'], displayCaveat: 'diagram',
  widget: '',
  zh: {
    title: '色度位置', summary: '左对齐和中对齐用错时，彩色边会镶出一条。',
    parts: [
      '高对比文字或斜边旁边有一条固定方向的色边，运动与否都在。',
      '4:2:0 的色度样点可以靠左，也可以在格子中间。MPEG-2 和 MPEG-1 的习惯不同。放大到 RGB 时用错站点，色度相对亮度平移半个像素。',
      '色边在静止的竖边上就有，不像隔行色度那样只跟运动走。',
      '没有单独的动画。配方用 scale 的 in_chroma_loc 和 out_chroma_loc。',
      '站点只标错、还没重采样：可以靠正确的上采样减轻或还原。已经合成进 RGB 再编码：写进样点。',
      '知道源的站点再放大。不确定时先看一条高对比竖边。',
      '不要用锐化去「修」这条色边。',
    ],
  },
  en: {
    title: 'Chroma siting', summary: 'Left and center siting, used the wrong way, leaves a colored fringe.',
    parts: [
      'High-contrast type or a diagonal carries a fringe of fixed direction, whether or not anything moves.',
      'A 4:2:0 chroma sample can sit to the left or in the center of the grid. MPEG-2 and MPEG-1 conventions differ. Upsampling to RGB with the wrong site shifts chroma by half a pixel against luma.',
      'The fringe is on a still vertical edge. Interlaced chroma, by contrast, shows up where things moved.',
      'There is no separate animation. The recipe sets scale in_chroma_loc and out_chroma_loc.',
      'A wrong site that has not been resampled yet can be repaired by upsampling correctly. Chroma already baked into RGB and re-encoded is in the samples.',
      'Upsample only after you know the source site. If you do not, look at one high-contrast vertical edge first.',
      'Do not sharpen the fringe away.',
    ],
  },
})

add({
  id: 'pixel-aspect', group: 'color', era: 'sd', removability: 'invert',
  tags: ['sar', 'dar'], related: ['bt601-sampling', 'standard-names'],
  labWidgets: [], recipeIds: ['setsar-169'], displayCaveat: 'diagram',
  widget: '',
  zh: {
    title: '非方像素', summary: '601 的 16:9 是把 720 个样点变宽，不是再加样点。',
    parts: [
      '人被拉高或压扁。圆变成椭圆。',
      '显示宽高比 DAR、样点宽高比 SAR、存储宽高，三件事一起决定画面。720×576 可以是 4:3 也可以是 16:9。709 起的高清节目交换改为方像素，SAR 是 1。',
      'ffprobe 同时看 sample_aspect_ratio 和 display_aspect_ratio。只改播放器里的拉伸，文件标签可能还是错的。',
      '这一条是标签和显示几何，没有场动画。',
      'SAR 标错、样点网格没被重采样：可以还原。已经按错误 SAR 缩成方像素再编码：写进样点。',
      '用 setsar 和 setdar 改标签。要真正变成方像素再 scale。',
      '不要只 setdar 而让 SAR 和存储宽度互相矛盾。',
    ],
  },
  en: {
    title: 'Non-square pixels', summary: '601 widescreen makes the 720 samples wider. It does not add samples.',
    parts: [
      'People are stretched tall or squashed. Circles become ellipses.',
      'Display aspect, sample aspect, and stored width decide the picture together. 720×576 can be 4:3 or 16:9. From 709 onward, HDTV program exchange uses square pixels, SAR 1.',
      'Read both sample_aspect_ratio and display_aspect_ratio. A player stretch can hide a tag that is still wrong.',
      'This is tag and display geometry. There is no field animation.',
      'A wrong SAR on a grid that has not been resampled is reversible. A file already scaled to square pixels with the wrong SAR and re-encoded is in the samples.',
      'Change the tag with setsar and setdar. Scale only when you actually want square pixels.',
      'Do not setdar alone and leave SAR and stored width contradicting each other.',
    ],
  },
})

add({
  id: 'composite-leftovers', group: 'color', era: 'analog', removability: 'attenuate',
  tags: ['composite'], related: ['bt601-sampling', 'denoise-limits'],
  labWidgets: [], recipeIds: ['chroma-denoise'], displayCaveat: 'diagram',
  widget: '',
  zh: {
    title: '复合编码的残留', summary: '点爬、彩虹、亮色互串。解码之后只能减轻，而且这不是 601。',
    parts: [
      '高对比竖边旁边爬着彩色点子，或大块色里透出细条纹。',
      '复合信号把色副载波和亮度加在一起。解码器收成样点之后，载波不再是一条可以关掉的副载波。见 <TLink slug="composite" />。601 采样的是分量，不应背这些锅。',
      '点子跟着副载波的节拍，不是 8×8 的压缩块。静止的彩条测试图上也能看见。',
      '没有干净的合成样片可以代表每一种解码器。配方只做色度方向的减轻。',
      '只能减轻。信息已经和亮度叠在同一批样点里。',
      '轻度色度降噪，接受细节损失。',
      '不要把点爬当蚊噪去大力 hqdn3d 整幅亮度。',
    ],
  },
  en: {
    title: 'Composite leftovers', summary: 'Dot crawl, rainbows, cross-color. After decoding you can only attenuate, and this is not 601.',
    parts: [
      'Colored dots crawl beside a high-contrast vertical edge, or fine stripes show through a flat color.',
      'Composite added the subcarrier to luma. After the decoder emits samples, the carrier is no longer a signal you can switch off. See <TLink slug="composite" />. 601 sampled component video and should not be blamed for this.',
      'The dots follow the subcarrier beat, not an 8×8 compression block. They can show up on a still color-bar chart.',
      'There is no clean synthetic that stands in for every decoder. The recipe only attenuates chroma.',
      'Attenuation only. The information already shares samples with luma.',
      'A light chroma denoise, and accept the detail loss.',
      'Do not treat dot crawl as mosquito noise and hit the whole luma plane with hqdn3d.',
    ],
  },
})

add({
  id: 'banding', group: 'clean', era: 'digital', removability: 'attenuate',
  tags: ['banding'], related: ['denoise-limits', 'levels'],
  labWidgets: [], recipeIds: ['gradfun-fix'], displayCaveat: 'diagram',
  widget: '',
  zh: {
    title: '色带', summary: '平滑渐变变成一圈一圈。gradfun 和 deband 用抖动换掉台阶。',
    parts: [
      '天空或暗部渐变有明显的等高线。',
      '位深不够或反复量化之后，相邻码值之间的台阶变得可见。宽色域用 8 bit 时更容易看见，这也是 2020 要求 10 或 12 bit 的原因之一。',
      '在渐变上能数出台阶，块边缘则更像压缩。',
      '没有单独的实验室。配方是 gradfun 或 deband。',
      '只能减轻。抖动盖住台阶，也加上细噪声。原来的中间码值回不来。',
      '轻度使用，看暗部。',
      '不要把色带当成可以用锐化解决的模糊。',
    ],
  },
  en: {
    title: 'Banding', summary: 'A smooth ramp becomes rings. gradfun and deband trade the steps for dither.',
    parts: [
      'Sky or a shadow ramp shows contour lines.',
      'After too little bit depth, or after quantizing again and again, the steps between code values become visible. Wide gamut in 8 bits shows them sooner, which is one reason 2020 asks for 10 or 12 bits.',
      'You can count the steps on a ramp. A block edge looks more like compression.',
      'There is no separate lab. The recipe is gradfun or deband.',
      'Attenuation only. Dither hides the steps and adds fine noise. The missing code values do not come back.',
      'Use a light pass and look at the shadows.',
      'Do not treat banding as blur to be sharpened.',
    ],
  },
})

add({
  id: 'compression-artifacts', group: 'clean', era: 'digital', removability: 'baked',
  tags: ['compression'], related: ['banding', 'denoise-limits', 'composite-leftovers'],
  labWidgets: [], recipeIds: [], displayCaveat: 'diagram',
  noRecipeReason: {
    zh: '块、蚊噪、振铃是量化已经丢掉的变换系数。滤镜只能掩盖。这里不展开成编码教程。',
    en: 'Blocks, mosquito noise, and ringing are transform coefficients quantization already discarded. A filter can only hide them. This is not a codec tutorial.',
  },
  widget: '',
  zh: {
    title: '块、蚊噪、振铃', summary: '量化写进样点之后，滤镜只能盖住，不能把系数找回来。',
    parts: [
      '平区有方块。高对比边缘冒出细碎的蚊子。锐边旁边有一圈过冲。',
      '这是变换编码的量化，不是隔行，也不是复合副载波。块边界按宏块或变换单元对齐。MPEG-2、H.264、HEVC、AV1 各从哪一年写进文件，见 <TLink slug="compression" />。',
      '块是方的，点爬是沿着边爬的彩色点。两者可以同时存在，但来源不同。',
      '没有滤镜对照，避免做成「一条命令修复压缩」。',
      '已经写进样点。',
      '若必须减轻，走 <PLink id="denoise-limits" />，并接受细节损失。',
      '不要把去块当成去隔行，也不要承诺能恢复原图。',
    ],
  },
  en: {
    title: 'Blocks, mosquitoes, ringing', summary: 'Once quantization is in the samples, a filter can hide it and cannot fetch the coefficients back.',
    parts: [
      'Flat areas break into squares. High-contrast edges shed fine mosquitoes. A sharp edge grows an overshoot.',
      'That is quantization of a transform code, not interlace and not a composite subcarrier. Block edges line up with macroblocks or transform units. When MPEG-2, H.264, HEVC, and AV1 each entered the file is on <TLink slug="compression" />.',
      'Blocks are square. Dot crawl is colored dots walking an edge. Both can be present. The sources differ.',
      'There is no filter contact sheet, so this does not become “one command repairs compression”.',
      'Already in the samples.',
      'If you must attenuate, use <PLink id="denoise-limits" /> and accept the detail loss.',
      'Do not treat a deblocker as a deinterlacer, and do not promise the original picture back.',
    ],
  },
})

add({
  id: 'denoise-limits', group: 'clean', era: 'digital', removability: 'attenuate',
  tags: ['denoise'], related: ['compression-artifacts', 'banding', 'composite-leftovers'],
  labWidgets: [], recipeIds: ['denoise-light'], displayCaveat: 'diagram',
  widget: '',
  zh: {
    title: '降噪的边界', summary: 'hqdn3d、nlmeans、atadenoise 都会吃掉细节。先问噪声是不是你要留的。',
    parts: [
      '噪点少了，头发、布料、胶片颗粒也少了。运动区可能拖脏。',
      'hqdn3d 是空域加时域的平滑。nlmeans 用相似块平均，更慢，仍会抹掉和噪声同尺度的纹理。atadenoise 沿时间平均，运动处若没有好好补偿就会拖影。',
      '在静止细纹理上比较处理前后。只看平区会高估效果。',
      '没有「无损降噪」演示。配方给的是轻参数。',
      '只能减轻。被平均掉的纹理不会回来。',
      '先小强度，必要时只处理色度。',
      '不要默认全片 hqdn3d=4:4:8:8 这种重参数。',
    ],
  },
  en: {
    title: 'Where denoise stops', summary: 'hqdn3d, nlmeans, and atadenoise all eat detail. Ask whether the noise is something you meant to keep.',
    parts: [
      'There is less noise, and less hair, cloth, and film grain. Motion can smear.',
      'hqdn3d smooths in space and time. nlmeans averages similar patches. It is slower, and it still removes texture the size of the noise. atadenoise averages along time and smears motion it does not compensate.',
      'Compare a still fine texture, not only a flat wall. Flat areas oversell the filter.',
      'There is no demonstration of lossless denoise. The recipe uses a light setting.',
      'Attenuation only. Texture that was averaged away does not return.',
      'Start small. Restrict the filter to chroma when that is enough.',
      'Do not default to a heavy hqdn3d=4:4:8:8 on the whole program.',
    ],
  },
})

for (const entry of P) writePhenomenon(entry)
console.log('wrote', P.length, 'color and clean phenomena')
