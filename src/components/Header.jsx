import './Header.css'

export default function Header() {
  return (
    <header className="main-header animate-in">
      <div className="logo-container">
        <h1>
          <span className="text-gradient">Praise</span>
          <span className="text-gold">List</span>
        </h1>
        <div className="glow-orb"></div>
      </div>
      <p>The anti-toxicity zone. Commend players who made your Overwatch 2 match great today.</p>
    </header>
  )
}
