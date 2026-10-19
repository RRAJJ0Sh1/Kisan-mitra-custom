'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sprout,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Calendar,
  LifeBuoy,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/translations';
import { getCurrentMandiSession, logoutMandi } from '@/lib/mandi-service';
import { MandiSession } from '@/types';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mandiSession, setMandiSession] = useState<MandiSession | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to Mandi Portal session changes
  useEffect(() => {
    const syncMandi = () => {
      setMandiSession(getCurrentMandiSession());
    };
    syncMandi();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', syncMandi);
      window.addEventListener('km_mandi_sync', syncMandi);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', syncMandi);
        window.removeEventListener('km_mandi_sync', syncMandi);
      }
    };
  }, [pathname]);

  const isMandiOperator = Boolean(mandiSession);

  const navLinks = [
    { href: '/', label: t('nav.home', language) },
    { href: '/slot-booking', label: t('nav.slotBooking', language) },
    ...(isMandiOperator ? [{ href: '/mandi/dashboard', label: t('nav.mandiDashboard', language) }] : []),
    { href: '/contact', label: t('nav.contact', language) },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Extract display name and avatar initials based on active role
  const displayName = isMandiOperator
    ? mandiSession?.mandi?.name || t('nav.apmcYard', language)
    : user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      (user?.phone ? `${t('nav.farmerAccount', language)} (${user.phone.slice(-4)})` : user?.email?.split('@')[0]) ||
      t('nav.farmerAccount', language);

  const userIdentifier = isMandiOperator
    ? `${mandiSession?.mandi?.code || ''} • ${t('nav.mandiOfficial', language)}`
    : user?.phone || user?.email || t('nav.farmerAccount', language);

  const initials = isMandiOperator
    ? 'AP'
    : displayName
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'F';

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMenuOpen(false);
    if (isMandiOperator) {
      logoutMandi();
      setMandiSession(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('km_mandi_sync'));
      }
      router.push('/login?role=mandi');
    } else {
      await signOut();
      router.push('/login?role=farmer');
    }
  };

  return (
    <header className="bg-primary-950/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center shadow-md group-hover:bg-primary-300 transition-colors">
              <Sprout className="w-5 h-5 text-primary-950" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-white text-base leading-tight">
                {mounted ? t('appName', language) : 'Kisan Mitra'}
              </p>
              <p className="text-xs text-primary-300 leading-tight hidden md:block">
                {mounted ? t('appTagline', language) : 'Farmer Procurement Queue & Status System'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1"
            role="navigation"
            aria-label={mounted ? t('common.mainNavigation', language) : 'Main Navigation'}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-primary-100 hover:text-white hover:bg-white/10'
                }`}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                <span>{mounted ? link.label : ''}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section: Language Selector + Auth States */}
          <div className="flex items-center gap-3">
            <LanguageSelector />

            {/* LOGGED IN STATE */}
            {user || mandiSession ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="profile-dropdown-button"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 py-1.5 px-3 rounded-full transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shadow-inner ring-2 shrink-0 ${
                    isMandiOperator ? 'bg-amber-600 text-amber-950 ring-amber-400/40' : 'bg-emerald-600 text-white ring-emerald-400/40'
                  }`}>
                    {initials}
                  </div>

                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight max-w-[130px] truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-primary-300 leading-none">
                      {isMandiOperator ? (mounted ? t('nav.mandiOfficial', language) : 'Official') : (mounted ? t('nav.online', language) : 'Online')}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-primary-300 transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="profile-dropdown-button"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 rounded-t-xl">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center shadow-sm ${
                          isMandiOperator ? 'bg-amber-500 text-amber-950' : 'bg-emerald-600 text-white'
                        }`}>
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {userIdentifier}
                          </p>
                        </div>
                      </div>
                      <div className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isMandiOperator ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100/80 text-emerald-700'
                      }`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>
                          {isMandiOperator ? (mounted ? t('nav.apmcYard', language) : 'APMC Yard') : (mounted ? t('nav.verifiedAccount', language) : 'Verified Account')}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {isMandiOperator ? (
                        <Link
                          href="/mandi/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-amber-900 bg-amber-50/50 hover:bg-amber-100 transition-colors"
                          role="menuitem"
                        >
                          <Building2 className="w-4 h-4 text-amber-600" />
                          <span>{mounted ? t('nav.mandiDashboard', language) : 'Dashboard'}</span>
                        </Link>
                      ) : null}

                      <Link
                        href="/slot-booking"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-900 transition-colors"
                        role="menuitem"
                      >
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <span>{mounted ? t('nav.mandiBookings', language) : 'Bookings'}</span>
                      </Link>

                      <Link
                        href="/contact"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-900 transition-colors"
                        role="menuitem"
                      >
                        <LifeBuoy className="w-4 h-4 text-primary-600" />
                        <span>{mounted ? t('nav.supportDesk', language) : 'Support'}</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{mounted ? t('nav.logout', language) : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* LOGGED OUT STATE */
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-white hover:text-primary-200 hover:bg-white/10 rounded-xl transition-colors min-h-[38px] flex items-center"
                >
                  <span>{mounted ? t('nav.signIn', language) : 'Sign In'}</span>
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-400 hover:bg-primary-300 text-primary-950 text-sm font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm hover:shadow min-h-[38px] flex items-center"
                >
                  <span>{mounted ? t('nav.register', language) : 'Register'}</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Trigger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-primary-200 hover:text-white hover:bg-white/10 transition-colors"
              aria-expanded={menuOpen}
              aria-label={mounted ? t('common.toggleMenu', language) : 'Toggle menu'}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3 animate-in slide-in-from-top-2">
            {(user || mandiSession) && (
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/10 mb-2">
                <div className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center ${
                  isMandiOperator ? 'bg-amber-500 text-amber-950' : 'bg-emerald-600 text-white'
                }`}>
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                  <p className="text-xs text-primary-300 truncate">{userIdentifier}</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-primary-100 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  <span>{mounted ? link.label : ''}</span>
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10">
              {user || mandiSession ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>{mounted ? t('nav.logout', language) : 'Logout'}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 text-center"
                  >
                    <span>{mounted ? t('nav.signIn', language) : 'Sign In'}</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-primary-400 text-primary-950 text-sm font-bold hover:bg-primary-300 text-center shadow-sm"
                  >
                    <span>{mounted ? t('nav.register', language) : 'Register'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}