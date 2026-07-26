/** Shared date handling for activities/programmes -- Firestore Timestamps,
 * plain Dates, and date strings all need to resolve the same way wherever
 * an activity's due date is read (ActivityPanel, the Overview metrics). */
export function toDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function activityDate(activity) {
  return toDate(activity?.dueAt || activity?.startsAt)
}

export function isPastDue(activity) {
  const dueAt = activityDate(activity)
  if (!dueAt) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueAt < today
}
