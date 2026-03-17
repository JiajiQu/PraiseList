import { useState, useEffect } from 'react'
import './PraiseFeed.css'

export default function PraiseFeed({ praises, onClaimBounty }) {
  const [filter, setFilter] = useState('')
  const [, setTick] = useState(0)

  // Force re-render every minute so timestamps like "Just now" and "Xh ago" update live
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredPraises = praises.filter(p => 
    (p.playerName || p.summoner || '').toLowerCase().includes(filter.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(filter.toLowerCase())
  )

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Hard Carry': return 'val-gold';
      case 'Mental Titan': return 'val-mint';
      case 'Unsung Hero': return 'val-blue';
      case 'Shotcaller': return 'val-purple';
      default: return 'val-mint';
    }
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  }

  return (
    <div className="praise-feed">
      <div className="feed-header">
        <div className="feed-title">
          <h2>Recent Praises</h2>
          <span className="badge glass-panel">{praises.length}</span>
        </div>
        
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search players or roles..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="feed-list">
        {filteredPraises.length === 0 ? (
          <div className="empty-state glass-panel">
            <p>No praises found. Be the first to shoutout someone!</p>
          </div>
        ) : (
          filteredPraises.map((praise, index) => (
            <div 
              key={praise.id} 
              className="praise-card glass-panel animate-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="card-header">
                <div className="summoner-info">
                  <h4>{praise.playerName || praise.summoner}</h4>
                  <span className="region-tag">{praise.region}</span>
                  {praise.status === 'open' && (
                    <span className="bounty-badge open">Bounty: ${praise.bountyAmount}</span>
                  )}
                  {(praise.status === 'claimed' || praise.status === 'pending_review') && (
                    <span className="bounty-badge claimed">
                      {praise.status === 'pending_review' ? 'Pending Review' : 'Bounty Claimed!'}
                    </span>
                  )}
                </div>
                <span className="time-ago">{formatTime(praise.timestamp)}</span>
              </div>
              
              <div className="card-body">
                <span className={`category-tag ${getCategoryColor(praise.category)}`}>
                  {praise.category}
                </span>
                <p className="comment">"{praise.comment}"</p>

                {(praise.status === 'claimed' || praise.status === 'pending_review') && praise.claimDetails && (
                  <div className="claim-details glass-panel">
                    <div className="claim-details-header">
                      <p className="claimed-by"><strong>{praise.claimDetails.claimerName}</strong> claimed this bounty.</p>
                      <span className="claim-time">{formatTime(praise.claimDetails.claimedAt)}</span>
                    </div>
                    
                    <div className="proof-gallery">
                      <div className="proof-item">
                        <span className="proof-label">Match Stats</span>
                        <a href={praise.claimDetails.evidenceLink} target="_blank" rel="noopener noreferrer" className="proof-image-link">
                          <div className="preview-box">
                            Click to View Image 🔗
                          </div>
                        </a>
                      </div>
                      
                      <div className="proof-item">
                        <span className="proof-label">Chat Confirmation</span>
                        <a href={praise.claimDetails.chatScreenshot} target="_blank" rel="noopener noreferrer" className="proof-image-link">
                           <div className="preview-box">
                            Click to View Image 🔗
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                {praise.status === 'open' && (
                  <button 
                    className="btn-primary claim-btn"
                    onClick={() => onClaimBounty(praise)}
                  >
                    Claim ${praise.bountyAmount}
                  </button>
                )}
                <button className="upvote-btn">
                  <span>👍</span> {praise.upvotes || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
