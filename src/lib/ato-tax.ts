// ATO 2024-25 tax brackets (Australian residents)
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0, base: 0 },
  { min: 18201, max: 45000, rate: 0.19, base: 0 },
  { min: 45001, max: 120000, rate: 0.325, base: 5092 },
  { min: 120001, max: 180000, rate: 0.37, base: 29467 },
  { min: 180001, max: Infinity, rate: 0.45, base: 51667 },
]

const MEDICARE_LEVY_RATE = 0.02
const MEDICARE_LEVY_THRESHOLD = 26000
const LITO_MAX = 700
const LITO_PHASE_OUT_START = 37500
const LITO_PHASE_OUT_END = 66667

export function calculateIncomeTax(grossAnnual: number): {
  tax: number
  medicareLevy: number
  lito: number
  totalTax: number
  effectiveRate: number
  netAnnual: number
} {
  // Base income tax
  let tax = 0
  for (const bracket of TAX_BRACKETS) {
    if (grossAnnual > bracket.min) {
      const taxableInBracket = Math.min(grossAnnual, bracket.max) - bracket.min
      tax = bracket.base + taxableInBracket * bracket.rate
    }
  }

  // Medicare levy
  let medicareLevy = 0
  if (grossAnnual > MEDICARE_LEVY_THRESHOLD) {
    medicareLevy = grossAnnual * MEDICARE_LEVY_RATE
  }

  // Low Income Tax Offset (LITO)
  let lito = 0
  if (grossAnnual <= LITO_PHASE_OUT_START) {
    lito = LITO_MAX
  } else if (grossAnnual <= LITO_PHASE_OUT_END) {
    lito = LITO_MAX - (grossAnnual - LITO_PHASE_OUT_START) * (LITO_MAX / (LITO_PHASE_OUT_END - LITO_PHASE_OUT_START))
  }

  const totalTax = Math.max(0, tax - lito) + medicareLevy
  const effectiveRate = grossAnnual > 0 ? totalTax / grossAnnual : 0
  const netAnnual = grossAnnual - totalTax

  return { tax, medicareLevy, lito, totalTax, effectiveRate, netAnnual }
}

export function grossToNet(grossAnnual: number, frequency: 'fortnightly' | 'weekly' | 'monthly' | 'annually' = 'annually') {
  const { netAnnual } = calculateIncomeTax(grossAnnual)
  switch (frequency) {
    case 'fortnightly': return netAnnual / 26
    case 'weekly': return netAnnual / 52
    case 'monthly': return netAnnual / 12
    default: return netAnnual
  }
}

export function netToGross(netAnnual: number): number {
  // Binary search to find gross from net
  let low = netAnnual
  let high = netAnnual * 2
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2
    const { netAnnual: calculated } = calculateIncomeTax(mid)
    if (Math.abs(calculated - netAnnual) < 1) return mid
    if (calculated < netAnnual) low = mid
    else high = mid
  }
  return (low + high) / 2
}

export function estimateCGT(costBasis: number, salePrice: number, holdingPeriodDays: number, otherIncome: number): number {
  const gain = salePrice - costBasis
  if (gain <= 0) return 0
  // 50% CGT discount if held > 365 days
  const taxableGain = holdingPeriodDays > 365 ? gain * 0.5 : gain
  const totalIncome = otherIncome + taxableGain
  const { totalTax: taxWithGain } = calculateIncomeTax(totalIncome)
  const { totalTax: taxWithout } = calculateIncomeTax(otherIncome)
  return taxWithGain - taxWithout
}
