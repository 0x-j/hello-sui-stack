import { Link } from '@tanstack/react-router';
import { WalletConnect } from './WalletConnect';
import { useState } from 'react';
import { Home, ImageIcon, Menu, X, Zap } from 'lucide-react';

const NAV_LINK_BASE = 'px-6 py-3 font-bold uppercase tracking-wider text-sm border-[3px] border-transparent text-smoke hover:border-cyber hover:text-cyber transition-all duration-200';
const NAV_LINK_ACTIVE = 'px-6 py-3 font-bold uppercase tracking-wider text-sm border-[3px] border-cyber text-cyber';

const MOBILE_LINK_BASE = 'flex items-center gap-4 p-4 font-bold uppercase tracking-wider text-sm border-l-[3px] border-transparent text-smoke hover:border-cyber hover:text-cyber hover:bg-slate transition-all duration-200';
const MOBILE_LINK_ACTIVE = 'flex items-center gap-4 p-4 font-bold uppercase tracking-wider text-sm border-l-[3px] border-magenta text-magenta bg-slate';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Main Header */}
      <header className="relative border-b-[3px] border-cyber bg-void/95 backdrop-blur-sm z-40">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyber via-magenta to-cyber opacity-50"></div>

        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left side - Logo and Nav */}
          <div className="flex items-center gap-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2 border-2 border-cyber text-cyber hover:bg-cyber hover:text-void transition-all duration-200"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyber blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <Zap className="relative text-cyber" size={28} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ghost glitch-hover">
                  SUI<span className="text-cyber">_</span>PROFILE
                </h1>
                <div className="text-[10px] uppercase tracking-widest text-smoke font-mono">
                  NFT Gallery
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <Link
                to="/"
                className={NAV_LINK_BASE}
                activeProps={{
                  className: NAV_LINK_ACTIVE,
                }}
              >
                Home
              </Link>
              <Link
                to="/gallery"
                className={NAV_LINK_BASE}
                activeProps={{
                  className: NAV_LINK_ACTIVE,
                }}
              >
                Gallery
              </Link>
            </nav>
          </div>

          {/* Right side - Wallet */}
          <WalletConnect />
        </div>
      </header>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-slate border-r-[5px] border-cyber shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-[3px] border-cyber">
          <h2 className="text-lg font-bold uppercase tracking-wider text-cyber">
            Navigation
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 border-2 border-magenta text-magenta hover:bg-magenta hover:text-void transition-all duration-200"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={MOBILE_LINK_BASE}
            activeProps={{
              className: MOBILE_LINK_ACTIVE,
            }}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>

          <Link
            to="/gallery"
            onClick={() => setIsOpen(false)}
            className={MOBILE_LINK_BASE}
            activeProps={{
              className: MOBILE_LINK_ACTIVE,
            }}
          >
            <ImageIcon size={20} />
            <span>Gallery</span>
          </Link>
        </nav>

        {/* Footer accent */}
        <div className="p-6 border-t-[3px] border-magenta">
          <div className="text-xs font-mono text-smoke opacity-50 uppercase tracking-widest">
            v1.0.0 • Neo-Brutal
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-void/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
