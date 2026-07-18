import { useState } from 'react'

export function DonorDetails({ donor, onClose, onContact }) {
  const [message, setMessage] = useState(`Hello ${donor.name},\n\nI would like to learn more about your funding opportunities and whether our work may be a fit.`)
  const [state, setState] = useState('idle')
  const submit = async (event) => {
    event.preventDefault()
    if (!message.trim()) return
    setState('sending')
    try { await onContact({ donor, message }); setState('sent') } catch (error) { setState(error.message || 'Unable to send your request.') }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="donor-modal" role="dialog" aria-modal="true" aria-labelledby="donor-details-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close donor details">×</button>
      <span className={`donor-logo ${donor.tone}`}>{donor.initials}</span>
      <p className="eyebrow">DONOR PROFILE</p><h2 id="donor-details-title">{donor.name}</h2>
      <p className="donor-description">{donor.description || donor.focus}</p>
      <dl className="donor-facts"><div><dt>Focus</dt><dd>{donor.focus}</dd></div><div><dt>Region</dt><dd>{donor.region}</dd></div><div><dt>Application deadline</dt><dd>{donor.deadline || 'Contact donor'}</dd></div></dl>
      {state === 'sent' ? <p className="contact-success" role="status">Your request was sent to your workspace team for follow-up.</p> : <form className="contact-form" onSubmit={submit}>
        <label htmlFor="contact-message">Request an introduction</label><textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} rows="5" />
        {state !== 'idle' && state !== 'sending' && <p className="form-error" role="alert">{state}</p>}
        <button className="primary-button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send contact request'}</button>
      </form>}
      <p className="contact-note">Contact details are kept private. Your workspace can handle the introduction with the donor’s consent.</p>
    </section>
  </div>
}
