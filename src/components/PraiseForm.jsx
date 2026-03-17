import { useState } from 'react'
import './PraiseForm.css'

export default function PraiseForm({ onSubmit }) {
  const [playerName, setPlayerName] = useState('')
  const [game, setGame] = useState('Overwatch 2')
  const [region, setRegion] = useState('NA')
  const [category, setCategory] = useState('Hard Carry')
  const [comment, setComment] = useState('')
  const [bounty, setBounty] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!playerName.trim() || !comment.trim()) return

    const newPraise = {
      id: crypto.randomUUID(),
      playerName: playerName.trim(),
      game,
      region,
      category,
      comment: comment.trim(),
      bountyAmount: Number(bounty) || 0,
      status: Number(bounty) > 0 ? 'open' : 'none',
      timestamp: new Date().toISOString(),
      upvotes: 0
    }

    onSubmit(newPraise)
    setPlayerName('')
    setComment('')
    setBounty('')
  }

  return (
    <div className="praise-form-card glass-panel">
      <div className="form-header">
        <h3>Give a Shoutout</h3>
        <p>Commend a player for a great game</p>
      </div>

      <form onSubmit={handleSubmit} className="praise-form">
        <div className="form-group row">
          <div className="input-wrapper flex-2">
            <label htmlFor="playerName">Player Name</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Super#1234 or Faker"
              required
            />
          </div>
          <div className="input-wrapper flex-2">
            <label htmlFor="game">Game</label>
            <select id="game" value={game} onChange={(e) => setGame(e.target.value)}>
              <option value="Overwatch 2">Overwatch 2</option>
              <option value="League of Legends">League of Legends</option>
              <option value="Valorant">Valorant</option>
              <option value="Apex Legends">Apex Legends</option>
            </select>
          </div>
          <div className="input-wrapper flex-1">
            <label htmlFor="region">Region</label>
            <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="NA">NA</option>
              <option value="EUW">EUW</option>
              <option value="EUNE">EUNE</option>
              <option value="KR">KR</option>
              <option value="OCE">OCE</option>
            </select>
          </div>
        </div>

        <div className="form-group row">
          <div className="input-wrapper flex-2">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Hard Carry">Hard Carry (1v9 Performance)</option>
              <option value="Mental Titan">Mental Titan (Stayed Positive)</option>
              <option value="Unsung Hero">Unsung Hero (Great Vision/Peel)</option>
              <option value="Shotcaller">Shotcaller (Great Macro)</option>
            </select>
          </div>
          <div className="input-wrapper flex-1">
            <label htmlFor="bounty">Bounty ($) <span className="optional">(Opt)</span></label>
            <input
              type="number"
              id="bounty"
              min="0"
              step="1"
              value={bounty}
              onChange={(e) => setBounty(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comment</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what made them great..."
            rows="3"
            required
          ></textarea>
        </div>

        <button type="submit" className="btn-primary form-submit">
          Submit Praise <span className="icon">✨</span>
        </button>
      </form>
    </div>
  )
}
