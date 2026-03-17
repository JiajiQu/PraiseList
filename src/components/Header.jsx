import './Header.css'
import heroBanner from '../assets/hero_banner.png'
import shieldIcon from '../assets/shield_icon.png'

export default function Header() {
  return (
    <header className="main-header animate-in">
      <div className="hero-banner-wrap">
        <img src={heroBanner} alt="Overwatch Heroes" className="hero-banner-img" />
        <div className="hero-banner-fade" />
      </div>
      <div className="logo-container">
        <img src={shieldIcon} alt="" className="shield-icon shield-left" />
        <h1>
          <span className="text-gradient">Praise</span>
          <span className="text-gold">List</span>
        </h1>
        <img src={shieldIcon} alt="" className="shield-icon shield-right" />
        <div className="glow-orb"></div>
      </div>
      <p>The anti-toxicity zone. Commend players who made your Overwatch 2 match great today.</p>
    </header>
  )
}
