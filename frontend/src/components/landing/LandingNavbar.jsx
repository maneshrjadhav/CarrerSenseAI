import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

export default function LandingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('capabilities');

  // Track window scroll for sticky navbar blur & active section highlight
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      // Only calculate active section on landing page
      if (location.pathname === '/') {
        const sections = ['capabilities', 'how-it-works', 'analytics', 'roadmap'];
        const scrollPosition = window.scrollY + 100;

        for (let i = sections.length - 1; i >= 0; i--) {
          const el = document.getElementById(sections[i]);
          if (el) {
            const top = el.offsetTop;
            if (scrollPosition >= top) {
              setActiveSection(sections[i]);
              return;
            }
          }
        }
        if (window.scrollY < 200) {
          setActiveSection('capabilities');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navItems = [
    { id: 'capabilities', label: 'Capabilities', type: 'anchor' },
    { id: 'how-it-works', label: 'How It Works', type: 'anchor' },
    { id: 'analytics', label: 'Analytical Console', type: 'anchor' },
    { id: 'roadmap', label: 'Career Roadmap', type: 'anchor' },
  ];

  const handleNavClick = (e, item) => {
    e.preventDefault();
    setMobileOpen(false);
    setActiveSection(item.id);

    if (item.type === 'route') {
      navigate(item.path);
      return;
    }

    if (location.pathname === '/') {
      const element = document.getElementById(item.id);
      if (element) {
        const yOffset = -62; // height of sticky navbar
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else {
      navigate(`/#${item.id}`);
      setTimeout(() => {
        const element = document.getElementById(item.id);
        if (element) {
          const yOffset = -62;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 120);
    }
  };

  return (
    <>
      <header
        className={`landing-sticky-navbar ${scrolled ? 'nav-scrolled' : ''}`}
        role="banner"
      >
        <div className="landing-navbar-container">
          {/* 1. Logo Section */}
          <Link to="/" className="landing-brand" aria-label="CareerSense AI Home">
            <div className="brand-icon-box glow-effect">
              <Sparkles size={17} className="brand-sparkle-glyph" />
            </div>
            <span className="brand-name-text">
              CareerSense <span className="brand-accent-text">AI</span>
            </span>
          </Link>

          {/* 2. Flat Navigation Links (Desktop: Directly on navbar, no bulky capsule wrapper) */}
          <nav className="desktop-nav-menu" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.type === 'anchor' ? `#${item.id}` : item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`nav-anchor-link ${isActive ? 'nav-link-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* 3. Authentication Section (Desktop) */}
          <div className="desktop-auth-actions">
            <Button
              variant="ghost"
              size="sm"
              className="nav-signin-btn"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              className="nav-cta-btn"
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </Button>
          </div>

          {/* 4. Responsive Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`mobile-hamburger-btn ${mobileOpen ? 'hamburger-active' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* 5. Mobile Navigation Panel */}
        {mobileOpen && (
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
            <div className="mobile-drawer-links">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.type === 'anchor' ? `#${item.id}` : item.path}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`mobile-drawer-link ${isActive ? 'mobile-link-active' : ''}`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={15} className="mobile-link-chevron" />
                  </a>
                );
              })}
            </div>

            <div className="mobile-drawer-actions">
              <Button
                variant="outline"
                size="md"
                className="w-full mobile-drawer-btn"
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
                iconPosition="right"
                className="w-full mobile-drawer-btn"
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

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
