/** Shared date handling for activities/programmes -- Firestore Timestamps,
 * plain Dates, and date strings all need to resolve the same way wherever
 * an activity's period is read (ActivityPanel, the Overview metrics). */
export function toDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** An activity now runs over a period: `startsAt` when it begins, `dueAt`
 * when it ends. Older records only ever set one of the two, so each end of
 * the period falls back to the other rather than showing as missing. */
export function activityPeriod(activity) {
  const start = toDate(activity?.startsAt) || toDate(activity?.dueAt)
  const end = toDate(activity?.dueAt) || toDate(activity?.startsAt)
  return { start, end }
}

export function activityDate(activity) {
  return activityPeriod(activity).end
}

export function isPastDue(activity) {
  const dueAt = activityDate(activity)
  if (!dueAt) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueAt < today
}

/** Render a period as "12 – 14 Aug" (same month) or "28 Aug – 3 Sep"
 * (spanning months). Always shows both ends -- including single-day
 * activities, where start and end fall on the same date -- so the format
 * stays consistent instead of collapsing to a bare date sometimes. */
export function formatPeriod(period) {
  const { start, end } = period
  if (!start && !end) return ''
  const from = start || end
  const to = end || start
  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
  const startLabel = sameMonth ? String(from.getDate()) : from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endLabel = to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${startLabel} – ${endLabel}`
}
