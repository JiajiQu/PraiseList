import { useState } from 'react'
import './BountyClaimModal.css'

export default function BountyClaimModal({ praise, onClose, onSubmitClaim }) {
  const [claimerName, setClaimerName] = useState('')
  const [evidenceLink, setEvidenceLink] = useState('')
  const [chatScreenshot, setChatScreenshot] = useState('')

  if (!praise) return null;

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!claimerName.trim() || !evidenceLink.trim() || !chatScreenshot.trim()) return

    onSubmitClaim(praise.id, {
      claimerName: claimerName.trim(),
      evidenceLink: evidenceLink.trim(),
      chatScreenshot: chatScreenshot.trim(),
      claimedAt: new Date().toISOString()
    })
  }

  return (
    <div className="modal-overlay animate-in">
      <div className="modal-content glass-panel">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h3>Claim ${praise.bountyAmount} Bounty <span className="icon">💰</span></h3>
          <p>For praising: <span className="highlight-summoner">{praise.playerName || praise.summoner}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="claim-form">
          <div className="form-group">
            <label htmlFor="claimerName">Your Player Name</label>
            <input
              type="text"
              id="claimerName"
              value={claimerName}
              onChange={(e) => setClaimerName(e.target.value)}
              placeholder="e.g. Super#1234 or Tryhard123"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="evidenceLink">Screenshot Link (KD/Scoreboard)</label>
            <input
              type="url"
              id="evidenceLink"
              value={evidenceLink}
              onChange={(e) => setEvidenceLink(e.target.value)}
              placeholder="e.g. https://imgur.com/..."
              required
            />
            <span className="help-text">Any image host link works. KD doesn't matter too much as long as you didn't hard throw!</span>
          </div>

          <div className="form-group margin-top">
            <label htmlFor="chatScreenshot">Chat Confirmation Link</label>
            <input
              type="url"
              id="chatScreenshot"
              value={chatScreenshot}
              onChange={(e) => setChatScreenshot(e.target.value)}
              placeholder="e.g. https://imgur.com/... (Chat screenshot)"
              required
            />
            <span className="help-text">Please provide a screenshot of the in-game chat where the praised player confirms your play.</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Claim</button>
          </div>
        </form>
      </div>
    </div>
  )
}
