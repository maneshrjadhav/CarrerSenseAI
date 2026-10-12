import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react';
import Button from '../common/Button';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className={`landing-sticky-navbar ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="landing-navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="landing-brand">
          <div className="brand-icon-box glow-effect">
            <Sparkles size={20} />
          </div>
          <span className="brand-name-text">CareerSense AI</span>
        </Link>

        {/* Desktop Nav Links (Clean Navigation - No Removed Sections) */}
        <nav className="desktop-nav-menu">
          <a href="#why" onClick={(e) => scrollToSection(e, 'why')} className="nav-anchor-link">
            Capabilities
          </a>
          <a href="#how" onClick={(e) => scrollToSection(e, 'how')} className="nav-anchor-link">
            How It Works
          </a>
          <a href="#semantic-map" onClick={(e) => scrollToSection(e, 'semantic-map')} className="nav-anchor-link">
            Semantic Map
          </a>
          <a href="#scan-demo" onClick={(e) => scrollToSection(e, 'scan-demo')} className="nav-anchor-link">
            Scan Demo
          </a>
          <a href="#roadmap" onClick={(e) => scrollToSection(e, 'roadmap')} className="nav-anchor-link">
            Roadmap
          </a>
          <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')} className="nav-anchor-link">
            Live Showcase
          </a>
        </nav>

        {/* CTA Group */}
        <div className="desktop-auth-actions">
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={ArrowRight}
            className="hover-arrow-btn"
            onClick={() => navigate('/register')}
          >
            Get Started Free
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Slide-down Menu */}
      {mobileOpen && (
        <div className="mobile-menu-drawer">
          <a href="#why" onClick={(e) => scrollToSection(e, 'why')} className="mobile-drawer-link">
            Capabilities
          </a>
          <a href="#how" onClick={(e) => scrollToSection(e, 'how')} className="mobile-drawer-link">
            How It Works
          </a>
          <a href="#semantic-map" onClick={(e) => scrollToSection(e, 'semantic-map')} className="mobile-drawer-link">
            Semantic Map
          </a>
          <a href="#scan-demo" onClick={(e) => scrollToSection(e, 'scan-demo')} className="mobile-drawer-link">
            Scan Demo
          </a>
          <a href="#roadmap" onClick={(e) => scrollToSection(e, 'roadmap')} className="mobile-drawer-link">
            Roadmap
          </a>
          <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')} className="mobile-drawer-link">
            Live Showcase
          </a>
          <div className="mobile-drawer-actions">
            <Button
              variant="outline"
              size="md"
              className="w-full mb-2"
              onClick={() => {
                setMobileOpen(false);
                navigate('/login');
              }}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              className="w-full"
              onClick={() => {
                setMobileOpen(false);
                navigate('/register');
              }}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
