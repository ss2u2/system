import React, { useState, useEffect, useRef } from 'react';
import { IconCloudCheck, IconLogout, IconUser, IconChevronDown } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ onOpenSyncModal }) {
  const [dateStr, setDateStr] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, signOut, loadingData } = useAuth();

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    setDateStr(formatted);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build avatar initials from name or email
  const getInitials = () => {
    if (!user) return '?';
    const name = user.user_metadata?.full_name || user.user_metadata?.name;
    if (name) {
      return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  };

  const getDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  };

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  };

  return (
    <div className="topbar">
      <div className="logo">
        sys<span>tem</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="topdate">{dateStr}</div>

        {/* Sync indicator */}
        {loadingData && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: '#5c5b6e',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#7c6af7',
              animation: 'topbarPulse 1.2s ease-in-out infinite',
            }} />
            Syncing…
          </div>
        )}

        {/* User avatar button */}
        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              id="topbar-account-btn"
              onClick={() => setMenuOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: menuOpen ? '#1e1e22' : '#17171a',
                border: '1px solid #2e2e36',
                borderRadius: 10, padding: '5px 10px 5px 6px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3a3a45'}
              onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.borderColor = '#2e2e36'; }}
            >
              {/* Avatar */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c6af7, #a594ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
                overflow: 'hidden',
              }}>
                {getAvatarUrl()
                  ? <img src={getAvatarUrl()} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials()
                }
              </div>

              {/* Sync dot */}
              <IconCloudCheck size={13} style={{ color: '#4ade80' }} />
              <IconChevronDown
                size={12}
                style={{
                  color: '#5c5b6e',
                  transition: 'transform 0.2s',
                  transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#17171a', border: '1px solid #2e2e36',
                borderRadius: 12, padding: 6, minWidth: 220,
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                zIndex: 200,
                animation: 'menuSlideIn 0.15s ease',
              }}>
                {/* User info header */}
                <div style={{
                  padding: '10px 12px 12px', borderBottom: '1px solid #1e1e22', marginBottom: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c6af7, #a594ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {getAvatarUrl()
                        ? <img src={getAvatarUrl()} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getInitials()
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0eff5', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getDisplayName()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#5c5b6e' }}>Synced to cloud</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <button
                  onClick={() => { setMenuOpen(false); onOpenSyncModal?.(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 12px', borderRadius: 8, border: 'none',
                    background: 'none', color: '#9b9aab', fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1e1e22'; e.currentTarget.style.color = '#f0eff5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9b9aab'; }}
                >
                  <IconUser size={15} />
                  Account Details
                </button>

                <button
                  id="topbar-signout-btn"
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 12px', borderRadius: 8, border: 'none',
                    background: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2a0f0f'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <IconLogout size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes topbarPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes menuSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
