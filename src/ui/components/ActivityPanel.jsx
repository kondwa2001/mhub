import { useMemo, useState } from 'react'
import { Icon } from './Icon'

function toDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function activityDate(activity) { return toDate(activity.dueAt || activity.startsAt) }

function isPastDue(activity) {
  const dueAt = activityDate(activity)
  if (!dueAt) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueAt < today
}

function statusFor(activity) {
  const dueAt = activityDate(activity)
  if (!dueAt) return activity.status === 'this_week' ? 'This week' : 'Upcoming'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekFromToday = new Date(today)
  weekFromToday.setDate(today.getDate() + 7)
  return dueAt <= weekFromToday ? 'This week' : 'Upcoming'
}

function DateBlock({ activity }) {
  const dueAt = activityDate(activity)
  if (!dueAt) return <div className="date-block"><strong>{activity.date}</strong><span>{activity.month}</span></div>
  return <div className="date-block"><strong>{String(dueAt.getDate()).padStart(2, '0')}</strong><span>{dueAt.toLocaleString('en', { month: 'short' }).toUpperCase()}</span></div>
}

export function ActivityPanel({ activities, onCreate }) {
  const [view, setView] = useState('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'Programme', description: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { upcoming, history } = useMemo(() => ({ upcoming: activities.filter((activity) => !isPastDue(activity)), history: activities.filter(isPastDue) }), [activities])
  const visibleActivities = view === 'upcoming' ? upcoming : history

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onCreate({ ...form, dueAt: new Date(`${form.dueDate}T09:00:00`) })
      setForm({ title: '', type: 'Programme', description: '', dueDate: '' })
      setShowForm(false)
      setView('upcoming')
    } catch (submissionError) {
      setError(submissionError.code === 'permission-denied' ? 'Only authorised MHub administrators can publish activities.' : submissionError.message || 'The activity could not be saved. Please try again.')
    } finally { setSaving(false) }
  }

  return <section className="activities" id="activities"><div className="section-heading"><div><p className="eyebrow">FROM THE HUB</p><h2>What MHub is doing</h2></div><button className="text-button" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}><Icon name="spark" />{showForm ? 'Close form' : 'Add activity'}</button></div>
    {showForm && <form className="activity-form" onSubmit={submit}><label>Activity title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Founder networking session" /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Programme</option><option>Community</option><option>Training</option><option>Event</option></select></label><label>Due date<input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label><label className="activity-description">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add a short description (optional)" rows="2" /></label><div className="activity-form-actions"><span>{error}</span><button className="primary-button" disabled={saving}>{saving ? 'Publishing…' : 'Publish activity'}</button></div></form>}
    <div className="activity-tabs" role="tablist" aria-label="Activity views"><button className={view === 'upcoming' ? 'chip active' : 'chip'} onClick={() => setView('upcoming')} role="tab" aria-selected={view === 'upcoming'}>Upcoming ({upcoming.length})</button><button className={view === 'history' ? 'chip active' : 'chip'} onClick={() => setView('history')} role="tab" aria-selected={view === 'history'}>History ({history.length})</button></div>
    <div className="activity-list">{visibleActivities.map((activity) => <article className="activity" key={activity.id || activity.title}><DateBlock activity={activity} /><div className="activity-main"><span className="activity-type">{activity.type}</span><h3>{activity.title}</h3><p>{activity.description || activity.copy}</p></div><span className={view === 'upcoming' && statusFor(activity) === 'This week' ? 'status now' : 'status'}>{view === 'history' ? 'Past due' : statusFor(activity)}</span></article>)}{visibleActivities.length === 0 && <p className="activity-empty">{view === 'upcoming' ? 'No upcoming activities have been published.' : 'No past activities yet.'}</p>}</div></section>
}
