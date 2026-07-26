import { useState } from 'react'
import { FOCUS_AREAS, SUPPORT_TYPES, focusLabel } from '../../backend/data/focusAreas'
import { saveCollaborator } from '../../backend/firebase/firestoreService'
import { Icon } from './Icon'

const EMPTY = {
  name: '',
  summary: '',
  collaborationFit: '',
  website: '',
  contactEmail: '',
  regions: '',
  focusTags: [],
  supportTypes: [],
}

const supportLabel = (id) => SUPPORT_TYPES.find((type) => type.id === id)?.label || id

export function CollaboratorDirectory({ collaborators, isSampleData, onAdded }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const toggle = (field, id) =>
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id) ? current[field].filter((v) => v !== id) : [...current[field], id],
    }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSaved('')

    if (!form.name.trim()) return setError('Give the donor a name.')
    if (!form.focusTags.length) return setError('Pick at least one mHub focus area.')

    setSaving(true)
    try {
      const record = await saveCollaborator({
        ...form,
        regions: form.regions.split(',').map((region) => region.trim()).filter(Boolean),
      })
      onAdded(record)
      setForm(EMPTY)
      setOpen(false)
      setSaved(`${record.name} added to the directory.`)
    } catch (saveError) {
      // Surfaces both validation failures and Firestore permission errors --
      // a rejected write must not look like a successful one.
      setError(saveError?.message || 'Could not save this donor. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="collab-directory">
      {isSampleData && (
        <div className="collab-notice">
          <Icon name="alert" />
          <p>
            <strong>Sample data.</strong> These are placeholder organisations, not real mHub partners.
            Nothing has been saved to the database yet — add a real donor below and the
            placeholders are replaced.
          </p>
        </div>
      )}

      {saved && (
        <div className="collab-notice success">
          <Icon name="check" />
          <p>{saved}</p>
        </div>
      )}

      <div className="collab-directory-head">
        <p className="eyebrow">
          {collaborators.length} {collaborators.length === 1 ? 'DONOR' : 'DONORS'}
        </p>
        <button className="collab-add" onClick={() => setOpen((current) => !current)}>
          <Icon name={open ? 'chevron' : 'spark'} />
          {open ? 'Cancel' : 'Add donor'}
        </button>
      </div>

      {open && (
        <form className="collab-form" onSubmit={submit}>
          <label className="collab-field">
            <span>Name</span>
            <input value={form.name} onChange={setField('name')} placeholder="Organisation name" />
          </label>

          <label className="collab-field">
            <span>What they do</span>
            <textarea
              rows="3"
              value={form.summary}
              onChange={setField('summary')}
              placeholder="One or two lines on what this organisation brings to a partnership…"
            />
          </label>

          <label className="collab-field">
            <span>Fit for mHub</span>
            <textarea
              rows="2"
              value={form.collaborationFit}
              onChange={setField('collaborationFit')}
              placeholder="Why this organisation is a good match for mHub specifically…"
            />
          </label>

          <fieldset className="collab-field">
            <legend>Focus areas</legend>
            <div className="collab-chips">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={form.focusTags.includes(area.id)}
                  className={form.focusTags.includes(area.id) ? 'collab-chip active' : 'collab-chip'}
                  onClick={() => toggle('focusTags', area.id)}
                >
                  {area.label}
                </button>
              ))}
            </div>
            <small>Only mHub&rsquo;s focus areas can be stored. At least one is required.</small>
          </fieldset>

          <fieldset className="collab-field">
            <legend>What they can offer</legend>
            <div className="collab-chips">
              {SUPPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={form.supportTypes.includes(type.id)}
                  className={form.supportTypes.includes(type.id) ? 'collab-chip active' : 'collab-chip'}
                  onClick={() => toggle('supportTypes', type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="collab-field">
            <span>Regions</span>
            <input value={form.regions} onChange={setField('regions')} placeholder="Malawi, Africa" />
            <small>Comma separated.</small>
          </label>

          <div className="collab-field-row">
            <label className="collab-field">
              <span>Website</span>
              <input value={form.website} onChange={setField('website')} placeholder="https://" />
            </label>
            <label className="collab-field">
              <span>Contact email</span>
              <input value={form.contactEmail} onChange={setField('contactEmail')} placeholder="name@example.org" />
            </label>
          </div>

          {error && <p className="collab-error">{error}</p>}

          <button className="collab-submit" disabled={saving}>
            <Icon name="save" />
            {saving ? 'Saving…' : 'Save donor'}
          </button>
        </form>
      )}

      <div className="collab-list">
        {collaborators.map((collaborator) => (
          <article className="collab-card" key={collaborator.id || collaborator.name}>
            <div className="collab-card-head">
              <div>
                <h3>{collaborator.name}</h3>
                {collaborator.summary && <p>{collaborator.summary}</p>}
                {collaborator.collaborationFit && <p className="collab-fit">{collaborator.collaborationFit}</p>}
              </div>
            </div>
            <div className="collab-tags">
              {(collaborator.focusTags || []).map((tag) => (
                <span className="collab-tag matched" key={tag}>
                  {focusLabel(tag)}
                </span>
              ))}
            </div>
            {(collaborator.regions?.length > 0 || collaborator.supportTypes?.length > 0) && (
              <div className="collab-meta">
                {collaborator.regions?.length > 0 && <span>{collaborator.regions.join(' · ')}</span>}
                {collaborator.supportTypes?.length > 0 && (
                  <span>{collaborator.supportTypes.map(supportLabel).join(' · ')}</span>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
