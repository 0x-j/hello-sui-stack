import { Link } from '@tanstack/react-router';
import { WalletConnect } from './WalletConnect';
import { useState } from 'react';
import { Home, ImageIcon, Menu, X } from 'lucide-react';

// Navigation link styles
const NAV_LINK_BASE = 'px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors';
const NAV_LINK_ACTIVE = 'px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow-sm transition-colors';

const MOBILE_LINK_BASE = 'flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors mb-2';
const MOBILE_LINK_ACTIVE = 'flex items-center gap-3 p-3 rounded-lg bg-blue-600 text-white transition-colors mb-2';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden text-gray-700"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Sui Profile NFT
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 ml-8">
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

        <WalletConnect />
      </header>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

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
            <span className="font-medium">Home</span>
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
            <span className="font-medium">Gallery</span>
          </Link>
        </nav>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
