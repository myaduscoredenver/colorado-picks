'use client'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
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

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function fmtDist(d) {
  if (d == null) return ''
  if (d < 0.1) return 'Right here'
  if (d < 10)  return d.toFixed(1) + ' mi'
  return Math.round(d) + ' mi'
}

// Sheet states and their translateY values
const SHEET = { peek: 'translateY(calc(100% - 64px))', half: 'translateY(45%)', full: 'translateY(0%)' }

export default function HomePage() {
  const [allSpots, setAllSpots]     = useState([])
  const [nearby, setNearby]         = useState([])
  const [userLoc, setUserLoc]       = useState(null)
  const [locating, setLocating]     = useState(true)
  const [selected, setSelected]     = useState(null)
  const [sheet, setSheet]           = useState('half')
  const [user, setUser]             = useState(null)
  const sheetRef                    = useRef(null)
  const startY                      = useRef(null)

  useEffect(() => {
    fetchSpots()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  async function fetchSpots() {
    const { data } = await supabase
      .from('spots')
      .select('*, profiles(username, display_name)')
      .eq('is_public', true)
    if (data) {
      setAllSpots(data.map(s => ({ ...s, username: s.profiles?.username, display_name: s.profiles?.display_name })))
    }
  }

  function handleUserLocation(loc) {
    setLocating(false)
    setUserLoc(loc)
  }

  // Sort by distance whenever location or spots update
  useEffect(() => {
    if (!allSpots.length) return
    if (!userLoc) { setNearby(allSpots.slice(0, 10)); return }
    const sorted = allSpots
      .map(s => ({ ...s, distance: haversine(userLoc.lat, userLoc.lng, s.lat, s.lng) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
    setNearby(sorted)
  }, [userLoc, allSpots])

  function selectSpot(spot) {
    setSelected(spot)
    setSheet('half')
  }

  function clearSelected() {
    setSelected(null)
  }

  // Swipe-to-dismiss / swipe-to-expand
  function onTouchStart(e) { startY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (startY.current == null) return
    const delta = e.changedTouches[0].clientY - startY.current
    startY.current = null
    if (delta > 60)  setSheet(s => s === 'full' ? 'half' : 'peek')
    if (delta < -60) setSheet(s => s === 'peek' ? 'half' : 'full')
  }

  const sheetTitle = locating
    ? '📍 Finding your location…'
    : userLoc
      ? `Nearest ${nearby.length} spots`
      : `All spots (${nearby.length})`

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden', background: '#e8e0d8' }}>

      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapClient
          spots={allSpots}
          mapClass="map-fullscreen"
          autoLocate={true}
          onUserLocation={handleUserLocation}
          onSpotClick={selectSpot}
          selectedSpot={selected}
        />
      </div>

      {/* Top bar */}
      <div className="top-bar">
        <div style={{ background: '#14532d', borderRadius: '12px', padding: '8px 13px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 2px 12px rgba(0,0,0,.35)' }}>
          <span style={{ fontSize: '17px' }}>🏔️</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', letterSpacing: '.01em' }}>Colorado Family Picks</span>
        </div>
        {user ? (
          <Link href="/dashboard" style={{ background: 'white', borderRadius: '12px', padding: '8px 13px', fontSize: '12px', fontWeight: 700, color: '#14532d', boxShadow: '0 2px 12px rgba(0,0,0,.25)', textDecoration: 'none' }}>
            My Spots
          </Link>
        ) : (
          <Link href="/login" style={{ background: 'white', borderRadius: '12px', padding: '8px 13px', fontSize: '12px', fontWeight: 700, color: '#14532d', boxShadow: '0 2px 12px rgba(0,0,0,.25)', textDecoration: 'none' }}>
            Log In
          </Link>
        )}
      </div>

      {/* Bottom sheet */}
      <div
        className="bottom-sheet"
        ref={sheetRef}
        style={{ transform: SHEET[sheet] }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Handle + header */}
        <div
          style={{ padding: '10px 16px 0', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setSheet(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'half')}
        >
          <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '2px', margin: '0 auto 10px' }} />

          {selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
              <button
                onClick={e => { e.stopPropagation(); clearSelected() }}
                style={{ background: 'none', border: 'none', color: '#14532d', fontWeight: 700, fontSize: '13px', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ← All spots
              </button>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>{selected.category}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{sheetTitle}</span>
              {userLoc && <span style={{ fontSize: '11px', color: '#9ca3af' }}>sorted by distance</span>}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {selected ? (
            /* ── SPOT DETAIL ── */
            <div style={{ paddingBottom: '32px' }}>
              {/* Color header */}
              <div style={{ background: CAT_COLOR[selected.category] || '#888', padding: '16px 20px 20px' }}>
                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {CAT_EMOJI[selected.category]} {selected.category}
                </div>
                <div style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginTop: '4px', lineHeight: 1.2 }}>
                  {selected.name}
                </div>
                {selected.distance != null && (
                  <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '13px', marginTop: '6px' }}>
                    {fmtDist(selected.distance)} from you
                  </div>
                )}
              </div>

              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Note */}
                {selected.note && selected.note_is_public && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: '6px' }}>Note</div>
                    <p style={{ fontSize: '15px', color: '#333', lineHeight: '1.55', margin: 0 }}>{selected.note}</p>
                  </div>
                )}
                {/* Added by */}
                {selected.username && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: '6px' }}>Added by</div>
                    <Link
                      href={`/${selected.username}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                    >
                      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#14532d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '14px' }}>
                        {(selected.display_name || selected.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{selected.display_name || selected.username}</div>
                        <div style={{ fontSize: '11px', color: '#14532d' }}>View their page →</div>
                      </div>
                    </Link>
                  </div>
                )}
                {/* Recommended by */}
                {selected.recommended_by && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: '4px' }}>Recommended by</div>
                    <div style={{ fontSize: '14px', color: '#555' }}>{selected.recommended_by}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── NEARBY LIST ── */
            <div>
              {locating && (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  Requesting your location…
                </div>
              )}
              {nearby.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => selectSpot(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', minHeight: '64px' }}
                >
                  {/* Rank */}
                  <div style={{ width: '24px', textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#d1d5db' }}>{i + 1}</span>
                  </div>
                  {/* Emoji in colored circle */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: CAT_COLOR[s.category] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {CAT_EMOJI[s.category]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                      {s.category}
                      {s.display_name && <> · {s.display_name}</>}
                    </div>
                  </div>
                  {/* Distance + chevron */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {s.distance != null && (
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#14532d' }}>{fmtDist(s.distance)}</div>
                    )}
                    <div style={{ fontSize: '16px', color: '#d1d5db', marginTop: '1px' }}>›</div>
                  </div>
                </div>
              ))}

              {/* CTA for non-logged-in */}
              {!user && nearby.length > 0 && (
                <div style={{ padding: '20px 16px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>Know a great spot? Add it for other families!</p>
                  <Link href="/signup" style={{ display: 'inline-block', background: '#f97316', color: 'white', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
                    + Add Your Picks
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
