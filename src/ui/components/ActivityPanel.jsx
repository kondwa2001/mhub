import { useMemo, useState } from 'react'
import { activityDate, activityPeriod, formatPeriod, isPastDue } from '../../backend/data/activityDates'
import { Icon } from './Icon'

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
  const { start } = activityPeriod(activity)
  if (!start) return <div className="date-block"><strong>{activity.date}</strong><span>{activity.month}</span></div>
  return <div className="date-block"><strong>{String(start.getDate()).padStart(2, '0')}</strong><span>{start.toLocaleString('en', { month: 'short' }).toUpperCase()}</span></div>
}

export function ActivityPanel({ activities, onCreate }) {
  const [view, setView] = useState('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'Training', description: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { upcoming, history } = useMemo(() => ({ upcoming: activities.filter((activity) => !isPastDue(activity)), history: activities.filter(isPastDue) }), [activities])
  const visibleActivities = view === 'upcoming' ? upcoming : history

  const submit = async (event) => {
    event.preventDefault()
    if (form.endDate < form.startDate) {
      setError('The end date must be on or after the start date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onCreate({ ...form, startsAt: new Date(`${form.startDate}T09:00:00`), dueAt: new Date(`${form.endDate}T17:00:00`) })
      setForm({ title: '', type: 'Training', description: '', startDate: '', endDate: '' })
      setShowForm(false)
      setView('upcoming')
    } catch (submissionError) {
      setError(submissionError.code === 'permission-denied' ? 'You need to be signed in to publish an activity.' : submissionError.message || 'The activity could not be saved. Please try again.')
    } finally { setSaving(false) }
  }

  return <section className="activities" id="activities"><div className="section-heading"><div><p className="eyebrow">FROM THE HUB</p><h2>What MHub is doing</h2></div><button className="text-button" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}><Icon name="spark" />{showForm ? 'Close form' : 'Add activity'}</button></div>
    {showForm && <form className="activity-form" onSubmit={submit}><label>Activity title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Founder networking session" /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Training</option><option>Event</option></select></label><label>Period start<input required type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value, endDate: form.endDate && form.endDate < event.target.value ? event.target.value : form.endDate })} /></label><label>Period end<input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label><label className="activity-description">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add a short description (optional)" rows="2" /></label><div className="activity-form-actions"><span>{error}</span><button className="primary-button" disabled={saving}>{saving ? 'Publishing…' : 'Publish activity'}</button></div></form>}
    <div className="activity-tabs" role="tablist" aria-label="Activity views"><button className={view === 'upcoming' ? 'chip active' : 'chip'} onClick={() => setView('upcoming')} role="tab" aria-selected={view === 'upcoming'}>Upcoming ({upcoming.length})</button><button className={view === 'history' ? 'chip active' : 'chip'} onClick={() => setView('history')} role="tab" aria-selected={view === 'history'}>History ({history.length})</button></div>
    <div className="activity-list">{visibleActivities.map((activity) => <article className="activity" key={activity.id || activity.title}><DateBlock activity={activity} /><div className="activity-main"><span className="activity-type">{activity.type}</span><h3>{activity.title}</h3><p className="activity-period">{formatPeriod(activityPeriod(activity))}</p><p>{activity.description || activity.copy}</p></div><span className={view === 'upcoming' && statusFor(activity) === 'This week' ? 'status now' : 'status'}>{view === 'history' ? 'Past due' : statusFor(activity)}</span></article>)}{visibleActivities.length === 0 && <p className="activity-empty">{view === 'upcoming' ? 'No upcoming activities have been published.' : 'No past activities yet.'}</p>}</div></section>
}
