'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const MapClient = dynamic(() => import('@/components/MapClient'), { ssr: false })

const CAT_EMOJI = {
  'Hiking':'🏔️','Swimming':'🏊','Skiing/Snow':'⛷️','Camping':'🏕️',
  'Wildlife':'🦁','Museums':'🏛️','Attractions':'🎡','Family Dining':'🍕','Other':'📍',
}
const CAT_COLOR = {
  'Hiking':'#15803d','Swimming':'#0369a1','Skiing/Snow':'#7c3aed','Camping':'#92400e',
  'Wildlife':'#b45309','Museums':'#be123c','Attractions':'#c2410c','Family Dining':'#dc2626','Other':'#6b7280',
}

const SHEET = { peek: 'translateY(calc(100% - 64px))', half: 'translateY(40%)', full: 'translateY(0%)' }

export default function ProfilePage() {
  const { username } = useParams()
  const [profile, setProfile]   = useState(null)
  const [spots, setSpots]       = useState([])
  const [selected, setSelected] = useState(null)
  const [sheet, setSheet]       = useState('half')
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { if (username) load(username) }, [username])

  async function load(uname) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('username', uname).maybeSingle()
    if (!prof) { setNotFound(true); setLoading(false); return }
    setProfile(prof)
    const { data } = await supabase.from('spots').select('*').eq('user_id', prof.id).eq('is_public', true).order('created_at', { ascending: false })
    setSpots(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
      Loading…
    </div>
  )

  if (notFound) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>🏔️</div>
      <div style={{ fontWeight: 700, fontSize: '18px', color: '#374151' }}>Page not found</div>
      <div style={{ color: '#9ca3af', fontSize: '13px' }}>No one has claimed <strong>/{username}</strong> yet.</div>
      <Link href="/signup" style={{ background: '#f97316', color: 'white', borderRadius: '12px', padding: '11px 22px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', marginTop: '8px' }}>
        Claim /{username}
      </Link>
    </div>
  )

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>

      {/* Map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapClient
          spots={spots}
          mapClass="map-fullscreen"
          onSpotClick={s => { setSelected(s); setSheet('half') }}
          selectedSpot={selected}
        />
      </div>

      {/* Top bar */}
      <div className="top-bar">
        <Link href="/" style={{ background: '#14532d', borderRadius: '12px', padding: '8px 13px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 12px rgba(0,0,0,.35)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>←</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>Community Map</span>
        </Link>
      </div>

      {/* Bottom sheet */}
      <div className="bottom-sheet" style={{ transform: SHEET[sheet] }}>
        <div
          style={{ padding: '10px 16px 0', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => setSheet(s => s === 'full' ? 'half' : s === 'half' ? 'peek' : 'half')}
        >
          <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '2px', margin: '0 auto 10px' }} />
          {selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
              <button onClick={e => { e.stopPropagation(); setSelected(null) }} style={{ background: 'none', border: 'none', color: '#14532d', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>← Back</button>
            </div>
          ) : (
            /* Profile header */
            <div style={{ paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#14532d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
                  {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{profile.display_name || profile.username}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>@{profile.username} · {spots.length} public spots</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {selected ? (
            <div style={{ paddingBottom: '32px' }}>
              <div style={{ background: CAT_COLOR[selected.category] || '#888', padding: '14px 20px 18px' }}>
                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>{CAT_EMOJI[selected.category]} {selected.category}</div>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{selected.name}</div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selected.note && selected.note_is_public && (
                  <p style={{ fontSize: '15px', color: '#333', lineHeight: 1.55, margin: 0 }}>{selected.note}</p>
                )}
                {selected.recommended_by && (
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>— {selected.recommended_by}</div>
                )}
              </div>
            </div>
          ) : (
            spots.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No public spots yet.</div>
            ) : spots.map(s => (
              <div
                key={s.id}
                onClick={() => { setSelected(s); setSheet('half') }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', minHeight: '62px' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: (CAT_COLOR[s.category] || '#888') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {CAT_EMOJI[s.category]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{s.category}</div>
                </div>
                <span style={{ color: '#d1d5db', fontSize: '18px' }}>›</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
