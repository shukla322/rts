export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function km(n: number): string {
  return `${Math.round(n).toLocaleString('en-IN')} km`
}

export function pct(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diffMin = Math.max(0, Math.round((now - ts) / 60000))
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} h ago`
  return `${Math.round(diffHr / 24)} d ago`
}

export function compactNum(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
