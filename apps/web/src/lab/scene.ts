export type RGB = [number, number, number]

export const WALK_SPEED = 72

/**
 * Gap between the two fields in the demo.
 * A real field is 1/50 s, about one pixel at this walking speed.
 * The pictures use a longer gap so the teeth and the backward step can be seen.
 */
export const FIELD_DT = 0.28

export type Pose = { cx: number; swing: number }

const rooms = new Map<string, Uint8ClampedArray>()

export function fieldTime(y: number, tff: boolean, time: number, split: 'psf' | 'adjacent'): number {
  const top = y % 2 === 0
  const first = tff ? top : !top
  if (split === 'psf' || first) return time
  return time + FIELD_DT
}

export function poseAt(time: number, width: number): Pose {
  const span = width + 90
  const travel = ((time * WALK_SPEED) % span + span) % span
  return { cx: travel - 40, swing: Math.sin(time * 6.2) }
}

export function paintScene(
  image: ImageData,
  timeForLine: (y: number) => number | null,
): void {
  const { width: w, height: h, data } = image
  data.set(roomBuffer(w, h))
  const evenTime = timeForLine(0)
  const oddTime = h > 1 ? timeForLine(1) : evenTime
  let split = true
  for (let y = 0; y < h; y += 1) {
    const time = timeForLine(y)
    const expect = y % 2 === 0 ? evenTime : oddTime
    if (time !== expect) split = false
    if (time == null) fillRow(data, w, y, 8, 10, 8)
  }
  if (!split) {
    for (let y = 0; y < h; y += 1) {
      const time = timeForLine(y)
      if (time == null) continue
      stamp(data, w, h, poseAt(time, w), y % 2 === 0 ? 'even' : 'odd', 1)
    }
    return
  }
  if (evenTime != null) stamp(data, w, h, poseAt(evenTime, w), 'even', 1)
  if (oddTime != null) stamp(data, w, h, poseAt(oddTime, w), 'odd', 1)
}

export function paintStill(image: ImageData, time: number): void {
  const { width: w, height: h, data } = image
  data.set(roomBuffer(w, h))
  stamp(data, w, h, poseAt(time, w), 'all', 1)
}

export function paintDoubledField(image: ImageData, time: number, evenField: boolean): void {
  const { width: w, height: h, data } = image
  const room = roomBuffer(w, h)
  for (let y = 0; y < h; y += 1) {
    const sy = evenField ? y & ~1 : Math.min(h - 1, y | 1)
    data.set(room.subarray(sy * w * 4, (sy + 1) * w * 4), y * w * 4)
  }
  stamp(data, w, h, poseAt(time, w), evenField ? 'double-even' : 'double-odd', 1)
}

export function paintWeavePoses(image: ImageData, evenPose: Pose, oddPose: Pose): void {
  const { width: w, height: h, data } = image
  data.set(roomBuffer(w, h))
  stamp(data, w, h, evenPose, 'even', 1)
  stamp(data, w, h, oddPose, 'odd', 1)
}

export function paintLamp(image: ImageData, time: number, alternate: boolean): void {
  paintStill(image, time)
  if (!alternate) return
  const { width: w, height: h, data } = image
  for (let y = 0; y < h; y += 1) {
    const gain = y % 2 === 0 ? 1.35 : 0.45
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4
      data[i] = clamp(data[i] * gain)
      data[i + 1] = clamp(data[i + 1] * gain)
      data[i + 2] = clamp(data[i + 2] * gain)
    }
  }
}

export function paintTrail(image: ImageData, poses: Array<Pose & { gain: number }>): void {
  const { width: w, height: h, data } = image
  data.set(roomBuffer(w, h))
  poses.forEach((pose) => stamp(data, w, h, pose, 'all', pose.gain))
}

export function sampleScene(x: number, y: number, w: number, h: number, time: number): RGB {
  const room = roomPixel(x, y, w, h)
  const body = walkerPixel(x, y, poseAt(time, w), (h * 0.74) | 0)
  return body ?? room
}

function fillRow(data: Uint8ClampedArray, w: number, y: number, r: number, g: number, b: number) {
  const start = y * w * 4
  for (let x = 0; x < w; x += 1) {
    const i = start + x * 4
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }
}

function roomBuffer(w: number, h: number): Uint8ClampedArray {
  const key = `${w}x${h}`
  const hit = rooms.get(key)
  if (hit) return hit
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b] = roomPixel(x, y, w, h)
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  rooms.set(key, data)
  return data
}

function roomPixel(x: number, y: number, w: number, h: number): RGB {
  const ground = (h * 0.74) | 0
  if (y >= ground) {
    const plank = (Math.floor(x / 24) % 2) === 0
    return plank ? [104, 84, 64] : [78, 64, 50]
  }
  let rgb: RGB = [142, 132, 116]
  if (x >= 34 && x < 128 && y >= 26 && y < ground - 24) {
    rgb = [112, 164, 184]
    const mullion = (x >= 76 && x < 82) || (y >= 78 && y < 84)
    const blind = y % 5 === 0
    if (mullion || blind) rgb = [236, 230, 216]
  }
  const door0 = w - 150
  const door1 = w - 68
  if (x >= door0 && x < door1 && y >= 36 && y < ground) {
    rgb = x < door0 + 8 || x >= door1 - 8 ? [188, 160, 116] : [32, 28, 26]
  }
  return rgb
}

type Rows = 'all' | 'even' | 'odd' | 'double-even' | 'double-odd'

function stamp(data: Uint8ClampedArray, w: number, h: number, pose: Pose, rows: Rows, gain: number) {
  const ground = (h * 0.74) | 0
  const x0 = Math.max(0, Math.floor(pose.cx - 52))
  const x1 = Math.min(w, Math.ceil(pose.cx + 52))
  const y0 = Math.max(0, ground - 120)
  const y1 = Math.min(h, ground + 4)
  for (let y = y0; y < y1; y += 1) {
    if (rows === 'even' && (y & 1)) continue
    if (rows === 'odd' && (y & 1) === 0) continue
    const sy = rows === 'double-even' ? (y & ~1) : rows === 'double-odd' ? Math.min(h - 1, y | 1) : y
    for (let x = x0; x < x1; x += 1) {
      const color = walkerPixel(x, sy, pose, ground)
      if (!color) continue
      const i = (y * w + x) * 4
      data[i] = mix(data[i], color[0], gain)
      data[i + 1] = mix(data[i + 1], color[1], gain)
      data[i + 2] = mix(data[i + 2], color[2], gain)
    }
  }
}

function walkerPixel(x: number, y: number, pose: Pose, ground: number): RGB | null {
  const { cx, swing } = pose
  const dx = x - cx
  const headY = ground - 96
  const headDx = dx
  const headDy = y - headY
  if (headDx * headDx + headDy * headDy < 16 * 16) {
    if (y < headY - 2) return [42, 32, 28]
    return [228, 184, 150]
  }
  if (Math.abs(dx) <= 14 && y >= ground - 80 && y < ground - 44) return [198, 78, 40]
  if (segment(x, y, cx - 10, ground - 74, cx - 10 - swing * 20, ground - 48, 4)) return [198, 78, 40]
  if (segment(x, y, cx + 10, ground - 74, cx + 10 + swing * 20, ground - 48, 4)) return [228, 184, 150]
  if (segment(x, y, cx - 6, ground - 44, cx - 6 + swing * 30, ground, 6)) return [32, 40, 58]
  if (segment(x, y, cx + 6, ground - 44, cx + 6 - swing * 30, ground, 6)) return [32, 40, 58]
  return null
}

function segment(x: number, y: number, x0: number, y0: number, x1: number, y1: number, radius: number): boolean {
  const vx = x1 - x0
  const vy = y1 - y0
  const len2 = vx * vx + vy * vy || 1
  let t = ((x - x0) * vx + (y - y0) * vy) / len2
  if (t < 0) t = 0
  else if (t > 1) t = 1
  const px = x0 + t * vx - x
  const py = y0 + t * vy - y
  return px * px + py * py <= radius * radius
}

function mix(base: number, ink: number, gain: number): number {
  return clamp(base + (ink - base) * gain)
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}
