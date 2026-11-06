export type MatrixId = 'bt601' | 'bt709' | 'bt2020'

export const MATRICES: Record<MatrixId, { kr: number; kb: number; label: string }> = {
  bt601: { kr: 0.299, kb: 0.114, label: 'BT.601' },
  bt709: { kr: 0.2126, kb: 0.0722, label: 'BT.709' },
  bt2020: { kr: 0.2627, kb: 0.0593, label: 'BT.2020' },
}

export type RGB = { r: number; g: number; b: number }

export function reinterpret(rgb: RGB, from: MatrixId, to: MatrixId): RGB {
  const a = MATRICES[from]
  const b = MATRICES[to]
  const kgA = 1 - a.kr - a.kb
  const y = a.kr * rgb.r + kgA * rgb.g + a.kb * rgb.b
  const cb = (rgb.b - y) / (2 * (1 - a.kb))
  const cr = (rgb.r - y) / (2 * (1 - a.kr))
  const r = y + 2 * (1 - b.kr) * cr
  const bl = y + 2 * (1 - b.kb) * cb
  const kgB = 1 - b.kr - b.kb
  const g = (y - b.kr * r - b.kb * bl) / kgB
  return { r, g, b: bl }
}

export function cssColor(rgb: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255)))
  return `rgb(${c(rgb.r)} ${c(rgb.g)} ${c(rgb.b)})`
}

/** CIE 1931 2° xy samples, 10 nm from 380 nm through 680 nm. */
export const CIE_LOCUS: Array<[number, number]> = [
  [0.1741, 0.005],
  [0.1738, 0.0049],
  [0.1703, 0.0058],
  [0.1669, 0.0086],
  [0.1566, 0.0177],
  [0.1355, 0.0399],
  [0.1241, 0.0578],
  [0.1096, 0.0868],
  [0.0913, 0.1327],
  [0.0687, 0.2007],
  [0.0454, 0.295],
  [0.0235, 0.4127],
  [0.0082, 0.5384],
  [0.0039, 0.6548],
  [0.0139, 0.7502],
  [0.0389, 0.812],
  [0.0743, 0.8338],
  [0.1142, 0.8262],
  [0.1547, 0.8059],
  [0.1929, 0.7816],
  [0.2296, 0.7543],
  [0.2658, 0.7243],
  [0.3016, 0.6923],
  [0.3373, 0.6589],
  [0.3731, 0.6245],
  [0.4087, 0.5896],
  [0.4441, 0.5547],
  [0.4788, 0.5202],
  [0.5125, 0.4866],
  [0.5448, 0.4544],
  [0.5752, 0.4242],
  [0.6029, 0.3965],
  [0.627, 0.3725],
  [0.6482, 0.3514],
  [0.6658, 0.334],
  [0.6801, 0.3197],
  [0.6915, 0.3083],
  [0.7006, 0.2993],
  [0.7079, 0.292],
  [0.714, 0.2859],
  [0.719, 0.2809],
  [0.723, 0.277],
  [0.726, 0.274],
  [0.7347, 0.2653],
]

/** CIE illuminant C, the 1953 NTSC white. */
export const ILLUMINANT_C: [number, number] = [0.3101, 0.3162]

export const PRIMARIES = {
  ntsc1953: {
    r: [0.67, 0.33],
    g: [0.21, 0.71],
    b: [0.14, 0.08],
  },
  bt709: {
    r: [0.64, 0.33],
    g: [0.3, 0.6],
    b: [0.15, 0.06],
  },
  bt2020: {
    r: [0.708, 0.292],
    g: [0.17, 0.797],
    b: [0.131, 0.046],
  },
  ebu: {
    r: [0.64, 0.33],
    g: [0.29, 0.6],
    b: [0.15, 0.06],
  },
  smpteC: {
    r: [0.63, 0.34],
    g: [0.31, 0.595],
    b: [0.155, 0.07],
  },
} as const

export const D65: [number, number] = [0.3127, 0.329]
