import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { root } from './phlib.mjs'

function q(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function sample(id, zh, en, input, vf, frames) {
  const vfPart = vf ? ` -vf ${q(vf)}` : ''
  const command = `ffmpeg -y -hide_banner -loglevel error -f lavfi -i ${q(input)}${vfPart} -start_number 0 -frames:v ${frames} media/generated/${id}/frame-%02d.png`
  return { id, zh, en, command }
}

const moving50 = "color=c=0x8e8474:s=480x270:r=50:d=0.4,format=yuv444p,geq=lum='clip(148-if(gt(Y\\,200)\\,50\\,0)-if(between(X\\,34\\,128)*between(Y\\,26\\,160)\\,28\\,0)+if(between(X\\,76\\,82)*between(Y\\,26\\,160)\\,70\\,0)+if(between(X\\,mod(N*64+150\\,380)\\,mod(N*64+150\\,380)+32)*between(Y\\,78\\,205)\\,80\\,0)+if(lt(pow(X-(mod(N*64+166\\,380))\\,2)+pow(Y-62\\,2)\\,220)\\,40\\,0)\\,16\\,235)':cb=128:cr=128"
const psf25 = "color=c=0x8e8474:s=480x270:r=25:d=0.4,format=yuv444p,geq=lum='clip(80+if(eq(mod(Y\\,4)\\,0)\\,140\\,0)+if(between(X\\,mod(N*18+150\\,380)\\,mod(N*18+150\\,380)+32)*between(Y\\,90\\,210)\\,70\\,0)+if(lt(pow(X-(mod(N*18+166\\,380))\\,2)+pow(Y-70\\,2)\\,200)\\,50\\,0)\\,0\\,255)':cb=128:cr=128"
const recipes = []

function add(recipe) { recipes.push(recipe) }

add({
  id: 'detect-idet',
  title: { zh: '用 idet 看隔行', en: 'Detect interlace with idet' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_streams -select_streams v input.mov\nffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  fix: 'ffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  avoid: 'Do not treat a single idet line as a verdict. PsF and 3:2 both flicker between progressive and interlaced.\n不要凭一行 idet 下结论。PsF 和 3:2 都会在 progressive 与 interlaced 之间摆动。',
})

add({
  id: 'bwdif-field',
  title: { zh: 'bwdif 按场输出', en: 'bwdif, one frame per field' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  fix: 'ffmpeg -i input.mov -vf bwdif=mode=send_field:parity=tff:deint=all -c:a copy output.mov',
  avoid: 'Skip this on PsF and on intact 3:2. parity must match the file; use bff when the scan is bottom-field first.\nPsF 和还没拆开的 3:2 不要走这条。场序是底场先行时把 parity 改成 bff。',
  samples: [
    sample('adjacent-weave', '编织：窗子是齐的，人裂成两场。', 'Weave: the window stays aligned, and the person splits into two fields.', moving50, 'tinterlace=mode=merge,setfield=tff', 8),
    sample('adjacent-bwdif', 'bwdif：看窗子和人。它多看了下一场。这段短图上和 yadif 很接近。', 'bwdif: look at the window and the person. It also uses the next field. On this short clip it stays close to yadif.', moving50, 'tinterlace=mode=merge,setfield=tff,bwdif=mode=send_field:parity=tff:deint=all', 8),
  ],
})

add({
  id: 'yadif-field',
  title: { zh: 'yadif 按场输出', en: 'yadif, one frame per field' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  fix: 'ffmpeg -i input.mov -vf yadif=mode=send_field:parity=tff:deint=all -c:a copy output.mov',
  avoid: 'Prefer bwdif when it is built in. Do not yadif a progressive frame that was only flagged interlaced.\n有 bwdif 时优先 bwdif。不要对只是标成隔行的逐行帧做 yadif。',
  samples: [
    sample('adjacent-yadif', 'yadif：窗子仍齐，人身上的齿减轻。看的是结果。', 'yadif: the window stays straight and the teeth on the person ease off. What you see is the result.', moving50, 'tinterlace=mode=merge,setfield=tff,yadif=mode=send_field:parity=tff:deint=all', 8),
    sample('psf-yadif', '同一张逐行图被当成隔行后抽出底场再拉高。细线只在顶场，这一格里没了。', 'The same progressive frame treated as interlaced: bottom field extracted and stretched. The fine lines live only in the top field.', psf25, 'setfield=tff,field=bottom,scale=480:270:flags=neighbor,setsar=1', 8),
  ],
})

add({
  id: 'psf-weave',
  title: { zh: 'PsF 当逐行', en: 'Treat PsF as progressive' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  fix: 'ffmpeg -i input.mov -vf setfield=prog -c:a copy output.mov',
  avoid: 'setfield does not rebuild samples. If a previous pass already bobbed the frame, the damage stays.\nsetfield 不重建样点。前面已经 bob 过的损失还在。',
  samples: [
    sample('psf-original', '细横线和竖边来自同一帧。', 'Fine lines and the edge from one frame.', psf25, '', 8),
  ],
})

add({
  id: 'bob-blend',
  title: { zh: '抛场与场混合', en: 'Bob and field blend' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  fix: 'ffmpeg -i input.mov -vf separatefields,scale=iw:ih*2:flags=neighbor,setsar=1 -c:a copy output-bob.mov',
  avoid: 'Blend hides teeth by averaging fields. It is not a finished deinterlace.\n混合用平均把齿涂掉，不是完成的去隔行。',
  samples: [
    sample('adjacent-bob', '抛场（bob）：每一场拉成整幅，齿没了，细节少一半。', 'Bob: each field stretched to a frame. The teeth go, and so does half the detail.', moving50, 'tinterlace=mode=merge,setfield=tff,separatefields,scale=480:270:flags=neighbor,setsar=1', 8),
  ],
})

add({
  id: 'fieldmatch-decimate',
  title: { zh: 'fieldmatch 然后 decimate', en: 'fieldmatch then decimate' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf idet -an -f null -',
  fix: 'ffmpeg -i input.mov -vf fieldmatch,decimate -c:a copy output.mov',
  avoid: 'Do not run this across a timeline that also contains real video interlace.\n不要对同时含有真隔行视频的整段时间线使用。',
  samples: [
    sample('telecine-23', '走动的人经过 pattern=23。混合帧里能看到两个人叠在一起。', 'A walking figure after pattern=23. Mixed frames show two figures overlapping.', "color=c=0x8e8474:s=480x270:r=24:d=0.5,format=yuv444p,geq=lum='clip(70+if(between(X\\,mod(N*48+150\\,380)\\,mod(N*48+150\\,380)+36)*between(Y\\,80\\,220)\\,120\\,0)+if(lt(pow(X-(mod(N*48+168\\,380))\\,2)+pow(Y-58\\,2)\\,280)\\,70\\,0)\\,16\\,235)':cb=128:cr=140,telecine=pattern=23,format=yuv420p", '', 10),
  ],
})

add({
  id: 'fieldorder-swap',
  title: { zh: '改场序', en: 'Change field order' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=field_order -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf setfield=tff -c:a copy output.mov\n# samples themselves stored bottom-first:\nffmpeg -i input.mov -vf fieldorder=tff -c:a copy output.mov',
  avoid: 'setfield only retags. fieldorder moves picture lines. Pick the one that matches the fault.\nsetfield 只改标签。fieldorder 会挪动扫描行。按故障选一个。',
})

add({
  id: 'scale-interl',
  title: { zh: '按场缩放', en: 'Scale per field' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=field_order,pix_fmt -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf scale=iw*2:ih*2:interl=1:flags=bicubic -c:a copy output.mov',
  avoid: 'interl=1 is for interlaced chroma and luma. A progressive file does not want it.\ninterl=1 给隔行亮度和色度。逐行文件不要加。',
})

add({
  id: 'deflicker-am',
  title: { zh: '整幅 deflicker', en: 'Whole-frame deflicker' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf signalstats,metadata=print -an -f null -',
  fix: 'ffmpeg -i input.mov -vf deflicker=size=9:mode=am -c:a copy output.mov',
  avoid: 'This normalizes one gain per frame. Rolling-shutter bands stay. A long window also tracks real lighting changes.\n这是每帧一个增益。滚动快门横条还在。窗口太长会跟上真正的灯光变化。',
  samples: [
    sample('flicker-global', '墙上一个人，整幅 4 Hz 起伏。', 'A person on a wall, whole-frame 4 Hz.', "color=c=0x8e8474:s=480x270:r=25:d=0.64,format=yuv444p,geq=lum='clip((90+if(lt(pow(X-240\\,2)+pow(Y-90\\,2)\\,1400)\\,70\\,0)+if(between(X\\,214\\,266)*between(Y\\,120\\,230)\\,55\\,0)+if(between(X\\,40\\,150)*between(Y\\,30\\,150)\\,30\\,0))*(0.55+0.45*sin(2*PI*4*T))\\,16\\,235)':cb=128:cr=128", '', 12),
    sample('flicker-global-deflicker', '同一起伏经过 deflicker。', 'That swing after deflicker.', "color=c=0x8e8474:s=480x270:r=25:d=0.64,format=yuv444p,geq=lum='clip((90+if(lt(pow(X-240\\,2)+pow(Y-90\\,2)\\,1400)\\,70\\,0)+if(between(X\\,214\\,266)*between(Y\\,120\\,230)\\,55\\,0)+if(between(X\\,40\\,150)*between(Y\\,30\\,150)\\,30\\,0))*(0.55+0.45*sin(2*PI*4*T))\\,16\\,235)':cb=128:cr=128,deflicker=size=9:mode=am", '', 12),
    sample('flicker-bands', '同一个人，横条按行错开。', 'The same person, with per-row bands.', "color=c=0x8e8474:s=480x270:r=25:d=0.64,format=yuv444p,geq=lum='clip((90+if(lt(pow(X-240\\,2)+pow(Y-90\\,2)\\,1400)\\,70\\,0)+if(between(X\\,214\\,266)*between(Y\\,120\\,230)\\,55\\,0)+if(between(X\\,40\\,150)*between(Y\\,30\\,150)\\,30\\,0))*(0.55+0.45*sin(2*PI*(4*T+Y/48)))\\,16\\,235)':cb=128:cr=128", '', 8),
    sample('flicker-bands-deflicker', '横条经过 deflicker，带还在。', 'Bands after deflicker. The bands remain.', "color=c=0x8e8474:s=480x270:r=25:d=0.64,format=yuv444p,geq=lum='clip((90+if(lt(pow(X-240\\,2)+pow(Y-90\\,2)\\,1400)\\,70\\,0)+if(between(X\\,214\\,266)*between(Y\\,120\\,230)\\,55\\,0)+if(between(X\\,40\\,150)*between(Y\\,30\\,150)\\,30\\,0))*(0.55+0.45*sin(2*PI*(4*T+Y/48)))\\,16\\,235)':cb=128:cr=128,deflicker=size=9:mode=am", '', 8),
  ],
})

add({
  id: 'deflicker-fields',
  title: { zh: '按场 deflicker', en: 'Deflicker per field' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffmpeg -hide_banner -i input.mov -vf separatefields,signalstats,metadata=print -an -f null -',
  fix: 'ffmpeg -i input.mov -vf separatefields,deflicker=size=9:mode=am,weave -c:a copy output.mov',
  avoid: 'Only for a whole-field gain. Bands inside the field are untouched. Weave assumes the field order you separated.\n只适用于整场一个增益。场内横条不动。weave 假定你拆开的场序是对的。',
})

add({
  id: 'tmix-frames',
  title: { zh: 'tmix 混合帧', en: 'Mix frames with tmix' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=r_frame_rate -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf tmix=frames=5 -c:a copy output.mov',
  avoid: 'The trail is the filter working. It does not remove spatial bands.\n拖影就是滤镜在起作用。它不去掉空间上的横条。',
  samples: [
    sample('flicker-global-tmix', '整幅闪经过 tmix=5。', 'Whole-frame flicker after tmix=5.', "color=c=0x8e8474:s=480x270:r=25:d=0.64,format=yuv444p,geq=lum='clip((90+if(lt(pow(X-240\\,2)+pow(Y-90\\,2)\\,1400)\\,70\\,0)+if(between(X\\,214\\,266)*between(Y\\,120\\,230)\\,55\\,0)+if(between(X\\,40\\,150)*between(Y\\,30\\,150)\\,30\\,0))*(0.55+0.45*sin(2*PI*4*T))\\,16\\,235)':cb=128:cr=128,tmix=frames=5", '', 12),
  ],
})

add({
  id: 'colorspace-convert',
  title: { zh: 'colorspace 真转换', en: 'Convert with colorspace' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=color_space,color_primaries,color_transfer,color_range -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf colorspace=iall=bt709:all=bt601-6-625 -c:a copy output.mov',
  avoid: 'iall is the data you actually have. all is the data you want. Swapping them is a second conversion, not an undo, once you re-encode.\niall 是你手头的数值。all 是你要的数值。重新编码之后，把两者对调是又一次转换，不是撤销。',
  samples: [
    sample('bars-709-as-601', '709 彩条按 601 矩阵解开。', '709 bars decoded with the 601 matrix.', 'smptebars=size=640x360:rate=1', 'format=yuv444p,colorspace=iall=bt709:all=bt601-6-625,format=rgb24', 1),
    sample('bars-709-as-2020', '709 彩条按 2020 解开。', '709 bars decoded as 2020.', 'smptebars=size=640x360:rate=1', 'format=yuv444p,colorspace=iall=bt709:all=bt2020,format=rgb24', 1),
  ],
})

add({
  id: 'setparams-retag',
  title: { zh: '只改标签', en: 'Retag only' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=color_space,color_primaries,color_transfer,color_range -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709 -c:a copy output.mov',
  avoid: 'The samples do not move. Use this only when the numbers were already right.\n样点不动。只有数值本来就对的时候才用。',
  samples: [
    sample('bars-tag', '彩条原样，标签可以另说。', 'Bars unchanged. The tag can say something else.', 'smptebars=size=640x360:rate=1', 'format=rgb24', 1),
  ],
})

add({
  id: 'range-scale',
  title: { zh: '展开或保持演播范围', en: 'Expand or keep studio range' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=color_range -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf scale=in_range=tv:out_range=pc -c:a copy output.mov',
  avoid: 'Expanding full-range data as if it were studio range clips both ends.\n把全幅数据当成演播范围再展开，两端会被裁掉。',
  samples: [
    sample('bars-limited-ok', '黑底上一个人。16 按演播范围展开后黑是黑。', 'A person on black. Studio range puts code 16 at black.', "color=c=black:s=640x360:r=1:d=1,format=yuv444p,geq=lum='clip(if(lt(pow(X-220\\,2)+pow(Y-170\\,2)\\,2800)\\,180\\,16)\\,16\\,235)':cb=128:cr=128", 'scale=in_range=tv:out_range=pc,format=rgb24', 1),
    sample('bars-limited-as-full', '同一张被当成全幅留下，黑发灰。', 'The same frame left as full range. Black stays gray.', "color=c=black:s=640x360:r=1:d=1,format=yuv444p,geq=lum='clip(if(lt(pow(X-220\\,2)+pow(Y-170\\,2)\\,2800)\\,180\\,16)\\,16\\,235)':cb=128:cr=128", 'scale=in_range=full:out_range=full,format=rgb24', 1),
  ],
})

add({
  id: 'setsar-169',
  title: { zh: '改 SAR / DAR', en: 'Set SAR / DAR' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=width,height,sample_aspect_ratio,display_aspect_ratio -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf setsar=64/45,setdar=16/9 -c:a copy output.mov',
  avoid: '64/45 is one common 16:9 flag for 720×576, not a universal constant. Read the file before copying it.\n64/45 是 720×576 常见的一种 16:9 标记，不是万能常数。先读文件再抄。',
})

add({
  id: 'transfer-srgb',
  title: { zh: '视频曲线与 sRGB', en: 'Video curve and sRGB' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=color_transfer,color_range,color_primaries -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf colorspace=iall=bt709:all=bt709:trc=iec61966-2-1:range=pc -c:a copy output.mov',
  avoid: 'Primaries may already match sRGB. The curve and the range still differ. This is not a PQ tone map.\nsRGB 的三基色可能已经和 709 一样。曲线和范围仍然不同。这不是 PQ 色调映射。',
})

add({
  id: 'chroma-loc',
  title: { zh: '指定色度站点', en: 'Set chroma location' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=chroma_location,pix_fmt -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf scale=iw:ih:in_chroma_loc=left:out_chroma_loc=center -c:a copy output.mov',
  avoid: 'Guessing the site and resampling bakes the opposite fringe.\n猜错站点再重采样，会把相反的色边写进去。',
})

add({
  id: 'chroma-denoise',
  title: { zh: '只减色度噪声', en: 'Attenuate chroma only' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=pix_fmt -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf hqdn3d=0:0:3:3 -c:a copy output.mov',
  avoid: 'The luma spatial and temporal strengths are 0 here. Raising them treats composite crawl as if it were grain in the picture.\n这里亮度和时间的强度是 0。把它们开大会把点爬当成画面颗粒来抹。',
})

add({
  id: 'gradfun-fix',
  title: { zh: 'gradfun 减轻色带', en: 'Attenuate banding with gradfun' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=pix_fmt,bits_per_raw_sample -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf gradfun=strength=1.2 -c:a copy output.mov',
  avoid: 'Dither is visible if you push strength. deband exists on this FFmpeg build if you need a different trade.\n强度过大时抖动可见。这块 FFmpeg 也有 deband，需要另一种交换时再用。',
})

add({
  id: 'denoise-light',
  title: { zh: '轻降噪', en: 'Light denoise' },
  requires: ['ffmpeg'], minVersion: '6.1',
  diagnose: 'ffprobe -hide_banner -show_entries stream=width,height,pix_fmt -select_streams v input.mov',
  fix: 'ffmpeg -i input.mov -vf hqdn3d=1.5:1.5:3:3 -c:a copy output.mov',
  avoid: 'nlmeans and atadenoise are available and still remove texture at the scale of the noise. Start here, do not start at hqdn3d=4:4:8:8.\nnlmeans 和 atadenoise 也在，它们仍会抹掉与噪声同尺度的纹理。从这里开始，不要从 hqdn3d=4:4:8:8 开始。',
})

const dir = path.join(root, 'content/recipes')
fs.mkdirSync(dir, { recursive: true })
for (const recipe of recipes) {
  fs.writeFileSync(path.join(dir, `${recipe.id}.yaml`), yaml.dump(recipe, { lineWidth: 1000, noRefs: true }))
}
console.log('wrote', recipes.length, 'recipes')

const tree = {
  start: 'start',
  nodes: {
    start: {
      q: { zh: '你先看见的是哪一种？', en: 'Which do you see first?' },
      choices: [
        { group: { zh: '边和运动', en: 'Edges and motion' }, label: { zh: '竖边有梳齿', en: 'Combing on vertical edges' }, next: 'comb' },
        { label: { zh: '细线在跳，没有梳齿', en: 'Fine lines shimmer, no comb' }, next: 'shimmer' },
        { label: { zh: '运动一顿一顿', en: 'Motion hitches' }, next: 'stutter' },
        { group: { zh: '亮', en: 'Light' }, label: { zh: '灯光在闪，或有横条', en: 'Lamps flicker, or there are bands' }, next: 'lamp' },
        { label: { zh: '整幅发灰，或暗部死黑', en: 'The whole frame is gray, or the shadows are dead black' }, leaf: 'levels' },
        { label: { zh: '上下或左右有黑边', en: 'Black bars above and below, or at the sides' }, next: 'bars' },
        { group: { zh: '形状和颜色', en: 'Shape and color' }, label: { zh: '人被拉高或压扁', en: 'People are stretched or squashed' }, leaf: 'pixel-aspect' },
        { label: { zh: '颜色偏了', en: 'The colors are wrong' }, next: 'color' },
        { label: { zh: '彩色边镶出一条', en: 'A colored fringe along an edge' }, next: 'fringe' },
        { label: { zh: '点爬、彩虹、亮色互串', en: 'Dots crawl, a rainbow, or cross-color' }, leaf: 'composite-leftovers' },
        { group: { zh: '痕迹', en: 'Traces' }, label: { zh: '一块一块，边上有蚊子或振铃', en: 'Blocks, mosquitoes, or ringing' }, leaf: 'compression-artifacts' },
        { label: { zh: '渐变变成一圈一圈', en: 'A gradient turns into rings' }, leaf: 'banding' },
        { label: { zh: '画面发糊，像被涂过', en: 'The picture looks smeared' }, leaf: 'denoise-limits' },
      ],
    },
    comb: {
      q: { zh: '两场是不是同一个时刻？', en: 'Are the two fields the same instant?' },
      choices: [
        { label: { zh: '是，细线是齐的', en: 'Yes, fine lines agree' }, leaf: 'psf-vs-adjacent' },
        { label: { zh: '不是，运动处才有齿', en: 'No, teeth appear where things move' }, next: 'comb-real' },
        { label: { zh: '有规律的重复帧', en: 'Frames repeat on a pattern' }, leaf: 'ivtc-vs-deinterlace' },
      ],
    },
    'comb-real': {
      q: { zh: '齿确认是真隔行之后，下一步看什么？', en: 'Once the teeth are real interlace, what next?' },
      choices: [
        { label: { zh: '选 yadif 还是 bwdif', en: 'Choose yadif or bwdif' }, leaf: 'yadif-bwdif' },
        { label: { zh: '运动在抖，像场序反了', en: 'Motion twitches, as if field order is reversed' }, leaf: 'field-order' },
        { label: { zh: '只想看 weave、blend、bob 的差别', en: 'Compare weave, blend, and bob' }, leaf: 'weave-blend-bob' },
      ],
    },
    shimmer: {
      q: { zh: '细线的跳更像哪一种？', en: 'Which shimmer is it?' },
      choices: [
        { label: { zh: '显像管上的大面积闪或行间闪', en: 'Large-area flicker or twitter on a CRT' }, leaf: 'area-and-twitter' },
        { label: { zh: '逐行面板把壳读错了', en: 'A progressive panel misread the shell' }, leaf: 'progressive-panel' },
      ],
    },
    lamp: {
      q: { zh: '闪是整幅一起，还是横条？', en: 'Does the whole frame pulse, or is it bands?' },
      choices: [
        { label: { zh: '先算灯和帧率', en: 'Compute the lamp against the frame rate' }, leaf: 'light-beat' },
        { label: { zh: '横条在滚或钉住', en: 'Bands roll or freeze' }, leaf: 'rolling-bands' },
        { label: { zh: '大约几秒才走一圈', en: 'A cycle takes several seconds' }, leaf: 'slow-roll-5994' },
        { label: { zh: '确认是整幅增益，想减轻', en: 'It is a whole-frame gain, and you want to attenuate it' }, leaf: 'deflicker' },
      ],
    },
    stutter: {
      q: { zh: '顿的规律是什么？', en: 'What pattern does the hitch follow?' },
      choices: [
        { label: { zh: '2-3 重复，像胶片', en: 'A 2-3 repeat, like film' }, leaf: 'judder' },
        { label: { zh: '这一段是胶片，下一段是视频', en: 'This shot is film, the next is video' }, leaf: 'mixed-cadence' },
        { label: { zh: '要反电视电影', en: 'Undo telecine' }, leaf: 'ivtc-vs-deinterlace' },
      ],
    },
    fringe: {
      q: { zh: '这条色边什么时候在？', en: 'When is the fringe there?' },
      choices: [
        { label: { zh: '静止的竖边就有', en: 'It is on a still vertical edge' }, leaf: 'chroma-siting' },
        { label: { zh: '只在运动处错', en: 'It is wrong only where things moved' }, leaf: 'interlaced-chroma' },
      ],
    },
    bars: {
      q: { zh: '黑带在哪？', en: 'Where is the black?' },
      choices: [
        { label: { zh: '黑带里没有画面，像后来补在窗口上的', en: 'The bars hold no picture. They look added in the window' }, leaf: 'pixel-aspect' },
        { label: { zh: '黑带已经在画面里面', en: 'The bars are already inside the picture' }, leaf: 'letterbox' },
      ],
    },
    color: {
      q: { zh: '偏色更像哪一种？', en: 'Which color fault is closer?' },
      choices: [
        { label: { zh: '红蓝走了，像矩阵', en: 'Reds and blues moved, like a matrix' }, leaf: 'matrices' },
        { label: { zh: '标着 2020，看起来像 709', en: 'Tagged 2020, looks like 709' }, leaf: 'tag-2020-content-709' },
        { label: { zh: '暗部不对，像曲线', en: 'Shadows are wrong, like a curve' }, leaf: 'transfer-curves' },
        { label: { zh: '整体发灰', en: 'The whole picture is gray' }, leaf: 'levels' },
      ],
    },
  },
}

fs.mkdirSync(path.join(root, 'content/decide'), { recursive: true })
fs.writeFileSync(path.join(root, 'content/decide/tree.yaml'), yaml.dump(tree, { lineWidth: 120, noRefs: true }))
console.log('wrote decision tree')

const glossary = {
  zh: "---\ntitle: \"术语\"\nsummary: \"图上的站按线排列。过程在时间线里。滤镜名保持英文。\"\n---\n\n## 基础\n\n- **隔行扫描（interlace）**：一帧分成两场，奇数行和偶数行分开曝光、分开显示。\n- **逐行（progressive）**：一帧里所有行来自同一次曝光。\n- **场（field）**：隔行的一半扫描。\n\n## 节拍与扫描\n\n- **50 Hz 与 60 Hz**：市电频率。模拟时代的场频锁在这上面。见 <TLink slug=\"mains\" />。\n- **29.97**：NTSC 彩色把 30 帧乘上 1000/1001。见 <TLink slug=\"ntsc\" />。\n- **525 与 625**：总行数。525 走 NTSC 的副载波，625 走 PAL 和 SECAM。见 <TLink slug=\"raster\" />。\n- **1080 与 2160**：高清和超高清的有效行。见 <TLink slug=\"hd-uhd\" />。\n\n## 模拟彩色\n\n- **NTSC**：1953 年加在 525 行上的彩色副载波。见 <TLink slug=\"ntsc\" />。\n- **CVBS**：彩色、图像、消隐、同步在同一根线上。NTSC、PAL、SECAM 离开演播室时都可以是这根线。见 <TLink slug=\"ntsc\" />。\n- **PAL 与 SECAM**：625 行上的两种副载波。见 <TLink slug=\"pal\" />。\n- **停播**：地面模拟发射停止之后，空中不再有这路副载波。各国年份不同。已经录下的点爬和彩虹还在样点里，见 <PLink id=\"composite-leftovers\" />。停播本身见 <TLink slug=\"ntsc\" />。\n\n## 色域\n\n- **1953 基色**：NTSC 纸面上的红绿蓝，白点是光源 C。0.299 / 0.587 / 0.114 按它们解出。见 <TLink slug=\"hd-uhd\" />。\n- **光源 C（illuminant C）**：大约 6774 K 的旧日光白，坐标 (0.310, 0.316)。见 <TLink slug=\"hd-uhd\" />。\n- **D65**：CIE 日光白，6504 K，坐标 (0.3127, 0.3290)。见 <TLink slug=\"hd-uhd\" />。\n- **EBU**：625 行演播监视器的荧光粉。见 <TLink slug=\"hd-uhd\" />。\n- **SMPTE-C**：525 行监视器后来使用的荧光粉。见 <TLink slug=\"hd-uhd\" />。\n- **BT.709**：1990 年高清节目交换的一套三基色和摄像机曲线。亮度行按这套基色和 D65 重解。见 <TLink slug=\"hd-uhd\" />。\n- **BT.2020**：2012 年把三基色放到光谱上的波长。曲线仍是 SDR（Standard Dynamic Range，标准动态范围）。见 <TLink slug=\"hd-uhd\" />。\n\n## 数字分量\n\n- **BT.601**：标清演播采样，13.5 MHz、每行 720 个亮度样点、4:2:2。CCIR 601 是它换机构之前的名字。亮度行仍用 1953 年的解。见 <TLink slug=\"bt601\" />。\n- **74.25 MHz 与 297 / 594 MHz**：1080 和 2160 常见的采样钟。见 <TLink slug=\"hd-uhd\" />。\n\n## 压缩\n\n- **MPEG-2**：1995 年的光盘和数字播出压缩。见 <TLink slug=\"compression\" />。\n- **H.264（AVC）**：2003 年的高清交付压缩。见 <TLink slug=\"compression\" />。\n- **HEVC（H.265）**：2013 年的超高清压缩。见 <TLink slug=\"compression\" />。\n- **AV1**：2018 年起在网上常见的后一代。见 <TLink slug=\"compression\" />。\n\n## 曲线\n\n- **OETF（Opto-Electronic Transfer Function，光-电转换）、EOTF（Electro-Optical Transfer Function，电-光转换）**：摄像机把光写成电，显示器把电还原成光。\n- **BT.1886**：参考显示器的电光曲线，大约 2.4。见 <PLink id=\"transfer-curves\" />。\n- **BT.2100**：在 2020 色容器上使用 PQ（Perceptual Quantizer，感知量化）或 HLG（Hybrid Log-Gamma，混合对数伽马）。见 <PLink id=\"bt2100-boundary\" />。\n\n## 胶片\n\n- **24 格**：电影的画格率。进 50 场会先加快到 25，进 60 场走 3:2。见 <TLink slug=\"film\" />。\n\n## 隔行\n\n- **TFF（Top Field First，顶场先行）**：先传送偶数行这一场。码流里的 `field_order` 可以写成这个值。\n- **BFF（Bottom Field First，底场先行）**：先传送奇数行这一场。和 TFF 一样，是码流里的标签。\n- **梳齿（combing）**：两场时间不同，编织后竖边错开。\n- **编织（weave）**：两场叠成一帧。静止和 PsF 是齐的，运动的竖边出齿。\n- **抛场（bob）**：每一场拉成整幅。齿没了，垂直细节少一半，画面会上下跳。\n- **yadif（yet another deinterlacing filter）**：静止的地方编织，动的地方插值。\n- **bwdif（Bob Weaver Deinterlacing Filter）**：也按动静分开，但会用到下一场。有它时优先用它。PsF 和还没拆开的 3:2 不要上。\n- **行间闪烁（twitter）**：细横线只活在一场里，按帧频闪。\n\n## 逐行\n\n- **PsF（Progressive segmented Frame，逐行分段帧）**：同一帧拆成两场，装在隔行壳里。两场是同一时刻。\n- **3:2 下拉（pulldown）**：24 格铺到 60 场，占场数是 2、3、2、3。\n\n## 频闪\n\n- **拍频（beat）**：灯的频率和拍摄频率对不齐时，亮度按它们的差频起伏。\n- **整幅闪（whole-frame flicker）**：全局快门下，一帧里的亮度一起变。\n- **滚动横条（rolling bands）**：滚动快门下，亮度差落在不同的行上。\n- **deflicker**：按时间把整帧亮度拉向窗口均值。横条拉不平。\n\n## 颜色\n\n- **SAR（Sample Aspect Ratio，样点宽高比）、DAR（Display Aspect Ratio，显示宽高比）**：一个是样点的宽高比，一个是显示出来的宽高比。\n- **演播范围（limited / tv）**：8 bit 的 Y 从 16 到 235。\n- **全幅（full / pc）**：0 到 255，计算机图形常用。\n- **矩阵（matrix）**：RGB 和 Y′CbCr 之间的系数。601、709、2020 各一套。\n- **三基色（primaries）**：红绿蓝在色度图上的顶点。\n",
  en: "---\ntitle: \"Glossary\"\nsummary: \"Stations on the diagram are grouped by line. The mechanism is on the timeline. Filter names stay in English.\"\n---\n\n## Basics\n\n- **Interlace**：a frame split into two fields. Odd and even lines are exposed and shown apart.\n- **Progressive**：every line of a frame comes from one exposure.\n- **Field**：one half of an interlaced scan.\n\n## Clock and raster\n\n- **50 Hz and 60 Hz**：mains frequencies. In the analog era the field rate locked to them. See <TLink slug=\"mains\" />.\n- **29.97**：NTSC color multiplies 30 frames by 1000/1001. See <TLink slug=\"ntsc\" />.\n- **525 and 625**：total line counts. 525 carries the NTSC subcarrier. 625 carries PAL and SECAM. See <TLink slug=\"raster\" />.\n- **1080 and 2160**：active lines for HD and UHD. See <TLink slug=\"hd-uhd\" />.\n\n## Analog color\n\n- **NTSC**：the 1953 color subcarrier on 525 lines. See <TLink slug=\"ntsc\" />.\n- **CVBS**：color, video, blanking, and sync on one wire. NTSC, PAL, and SECAM can all leave the studio on that wire. See <TLink slug=\"ntsc\" />.\n- **PAL and SECAM**：the two subcarriers on 625 lines. See <TLink slug=\"pal\" />.\n- **Shutdown**：after analog terrestrial transmission stops, that subcarrier is no longer on the air. The year differs by country. Dot crawl and rainbows already recorded stay in the samples. See <PLink id=\"composite-leftovers\" />. The shutdown itself is on <TLink slug=\"ntsc\" />.\n\n## Gamut\n\n- **1953 primaries**：the NTSC primaries on paper, with illuminant C as white. 0.299 / 0.587 / 0.114 was solved from them. See <TLink slug=\"hd-uhd\" />.\n- **Illuminant C**：the older daylight white, about 6774 K, at (0.310, 0.316). See <TLink slug=\"hd-uhd\" />.\n- **D65**：CIE daylight white, 6504 K, at (0.3127, 0.3290). See <TLink slug=\"hd-uhd\" />.\n- **EBU**：the studio-monitor phosphors for 625 lines. See <TLink slug=\"hd-uhd\" />.\n- **SMPTE-C**：the later monitor phosphors for 525 lines. See <TLink slug=\"hd-uhd\" />.\n- **BT.709**：the 1990 HDTV exchange primaries and camera curve. The luma row is solved again from those primaries and D65. See <TLink slug=\"hd-uhd\" />.\n- **BT.2020**：the 2012 primaries on spectral wavelengths. The curve is still SDR (Standard Dynamic Range). See <TLink slug=\"hd-uhd\" />.\n\n## Digital component\n\n- **BT.601**：studio sampling for standard definition, 13.5 MHz, 720 luma samples on the active line, 4:2:2. CCIR 601 is the name from before the institution changed. The luma row is still the 1953 solution. See <TLink slug=\"bt601\" />.\n- **74.25 MHz and 297 / 594 MHz**：the clocks commonly used for 1080 and 2160. See <TLink slug=\"hd-uhd\" />.\n\n## Compression\n\n- **MPEG-2**：the 1995 compression for discs and digital broadcast. See <TLink slug=\"compression\" />.\n- **H.264 (AVC)**：the 2003 compression used for HD delivery. See <TLink slug=\"compression\" />.\n- **HEVC (H.265)**：the 2013 compression used for UHDTV. See <TLink slug=\"compression\" />.\n- **AV1**：a later generation common on the web from 2018. See <TLink slug=\"compression\" />.\n\n## Curves\n\n- **OETF (Opto-Electronic Transfer Function), EOTF (Electro-Optical Transfer Function)**：the camera writes light as a signal, and the display turns that signal back into light.\n- **BT.1886**：the reference-display electro-optical curve, about 2.4. See <PLink id=\"transfer-curves\" />.\n- **BT.2100**：PQ (Perceptual Quantizer) or HLG (Hybrid Log-Gamma) in a 2020 color container. See <PLink id=\"bt2100-boundary\" />.\n\n## Film\n\n- **24 fps**：the film frame rate. Into 50 fields it is sped up to 25. Into 60 fields it takes the 3:2 path. See <TLink slug=\"film\" />.\n\n## Interlace\n\n- **TFF (Top Field First)**：the even-line field is sent first. `field_order` in the bitstream can say this.\n- **BFF (Bottom Field First)**：the odd-line field is sent first. Like TFF, it is a flag in the bitstream.\n- **Combing**：the two fields are different times, so a woven vertical edge splits.\n- **Weave**：stack the two fields into one frame. Still areas and PsF stay aligned. A moving edge grows teeth.\n- **Bob**：stretch each field to a full frame. The teeth go away, half the vertical detail goes with them, and the picture bobs.\n- **yadif (yet another deinterlacing filter)**：weave the still areas and interpolate the moving ones.\n- **bwdif (Bob Weaver Deinterlacing Filter)**：the same split, and it also uses the next field. Prefer it when it is available. Do not use it on PsF or on intact 3:2.\n- **Twitter**：a thin horizontal line lives in one field and flickers at frame rate.\n\n## Progressive\n\n- **PsF (Progressive segmented Frame)**：one frame split into two fields and carried in an interlaced shell. Both fields are the same instant.\n- **3:2 pulldown**：24 frames spread across 60 fields, held for 2, 3, 2, 3 fields.\n\n## Flicker\n\n- **Beat**：when the lamp frequency and the shooting frequency disagree, brightness rises and falls at their difference.\n- **Whole-frame flicker**：with a global shutter, the whole frame changes brightness together.\n- **Rolling bands**：with a rolling shutter, the brightness difference lands on different rows.\n- **deflicker**：pulls whole-frame brightness toward the window mean. It does not flatten bands.\n\n## Color\n\n- **SAR (Sample Aspect Ratio), DAR (Display Aspect Ratio)**：one is the shape of a sample, the other is the shape on screen.\n- **Limited / tv range**：8-bit Y from 16 to 235.\n- **Full / pc range**：0 to 255, usual for computer graphics.\n- **Matrix**：the coefficients between RGB and Y′CbCr. 601, 709, and 2020 each have a set.\n- **Primaries**：the red, green, and blue vertices on the chromaticity diagram.\n",
}

fs.mkdirSync(path.join(root, 'content/glossary'), { recursive: true })
for (const [lang, text] of Object.entries(glossary)) {
  fs.writeFileSync(path.join(root, 'content/glossary', `${lang}.mdx`), text)
}
console.log('wrote glossary')
