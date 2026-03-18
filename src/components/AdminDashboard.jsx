import { useState, useEffect } from 'react'
import './AdminDashboard.css'

export default function AdminDashboard({ apiUrl }) {
  const [adminKey, setAdminKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [pendingClaims, setPendingClaims] = useState([])
  const [allPraises, setAllPraises] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-key': adminKey
  }

  const login = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/admin/pending-claims`, { headers })
      if (res.ok) {
        const data = await res.json()
        setPendingClaims(data)
        setAuthenticated(true)
        fetchAllPraises()
      } else {
        setActionMessage({ type: 'error', text: 'Invalid admin key.' })
        setTimeout(() => setActionMessage(null), 3000)
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Could not connect to server.' })
    }
    setLoading(false)
  }

  const fetchPending = async () => {
    const res = await fetch(`${apiUrl}/api/admin/pending-claims`, { headers })
    if (res.ok) setPendingClaims(await res.json())
  }

  const fetchAllPraises = async () => {
    const res = await fetch(`${apiUrl}/api/admin/all-praises`, { headers })
    if (res.ok) setAllPraises(await res.json())
  }

  const handleAction = async (action, praiseId, label) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/${action}`, {
        method: 'POST', headers,
        body: JSON.stringify({ praiseId })
      })
      const data = await res.json()
      if (data.success) {
        setActionMessage({ type: 'success', text: `${label} successful!` })
        fetchPending()
        fetchAllPraises()
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Action failed.' })
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Action failed.' })
    }
    setTimeout(() => setActionMessage(null), 3000)
  }

  const formatTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString()
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="admin-container">
        <div className="admin-login glass-panel animate-in">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Enter your admin key to manage PraiseList</p>
          <div className="login-form">
            <input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
            />
            <button className="btn-primary" onClick={login} disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </div>
          {actionMessage && (
            <div className={`action-msg ${actionMessage.type}`}>{actionMessage.text}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container animate-in">
      <header className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pending'); fetchPending() }}
          >
            Pending Claims
            {pendingClaims.length > 0 && <span className="tab-badge">{pendingClaims.length}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('all'); fetchAllPraises() }}
          >
            All Praises
          </button>
        </div>
      </header>

      {actionMessage && (
        <div className={`action-msg ${actionMessage.type}`}>{actionMessage.text}</div>
      )}

      {activeTab === 'pending' && (
        <div className="claims-list">
          {pendingClaims.length === 0 ? (
            <div className="empty-admin glass-panel">
              <p>✅ No pending claims to review!</p>
            </div>
          ) : (
            pendingClaims.map(praise => (
              <div key={praise.id} className="claim-card glass-panel">
                <div className="claim-card-header">
                  <div>
                    <h3>{praise.playerName}</h3>
                    <span className="meta">{praise.game} · {praise.region} · {praise.category}</span>
                  </div>
                  <span className="bounty-amount">${praise.bountyAmount || praise.bountyamount}</span>
                </div>

                <p className="claim-comment">"{praise.comment}"</p>

                {praise.claimDetails && (
                  <div className="claim-evidence">
                    <div className="evidence-header">
                      <strong>Claimed by: {praise.claimDetails.claimerName}</strong>
                      <span className="meta">{formatTime(praise.claimDetails.claimedAt)}</span>
                    </div>
                    <div className="evidence-links">
                      {praise.claimDetails.evidenceLink && (
                        <a href={praise.claimDetails.evidenceLink} target="_blank" rel="noopener noreferrer" className="evidence-btn">
                          📊 View Match Stats
                        </a>
                      )}
                      {praise.claimDetails.chatScreenshot && (
                        <a href={praise.claimDetails.chatScreenshot} target="_blank" rel="noopener noreferrer" className="evidence-btn">
                          💬 View Chat Proof
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="claim-actions">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleAction('approve-claim', praise.id, 'Approval')}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleAction('reject-claim', praise.id, 'Rejection')}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="all-praises-list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Game</th>
                <th>Category</th>
                <th>Bounty</th>
                <th>Status</th>
                <th>Upvotes</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allPraises.map(p => (
                <tr key={p.id}>
                  <td className="player-cell">{p.playerName}</td>
                  <td>{p.game}</td>
                  <td>{p.category}</td>
                  <td>{(p.bountyAmount || p.bountyamount) > 0 ? `$${p.bountyAmount || p.bountyamount}` : '—'}</td>
                  <td><span className={`status-pill ${p.status}`}>{p.status}</span></td>
                  <td>{p.upvotes || 0}</td>
                  <td className="meta">{formatTime(p.timestamp)}</td>
                  <td>
                    <button 
                      className="action-btn delete-small"
                      onClick={() => handleAction('delete-praise', p.id, 'Delete')}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
