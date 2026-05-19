'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SpotModal from '@/components/SpotModal'
import { supabase } from '@/lib/supabaseClient'

const MapClient = dynamic(() => import('@/components/MapClient'), { ssr: false })

const CAT_EMOJI = {'Hiking':'🏔️','Swimming':'🏊','Skiing/Snow':'⛷️','Camping':'🏕️','Wildlife':'🦁','Museums':'🏛️','Attractions':'🎡','Family Dining':'🍕','Other':'📍'}

export default function DashboardPage() {
  const [user, setUser]         = useState(null)
  const [username, setUsername] = useState(null)
  const [spots, setSpots]       = useState([])
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(null)
  const [placingPin, setPlacingPin] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchSpots(session.user.id)
      supabase.from('profiles').select('username').eq('id', session.user.id).single()
        .then(({ data }) => data && setUsername(data.username))
    })
  }, [])

  async function fetchSpots(uid) {
    const { data } = await supabase.from('spots').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setSpots(data || [])
  }

  function handleMapClick(latlng) {
    if (!placingPin) return
    setPlacingPin(false)
    setModal({ latlng, spot: null })
  }

  async function handleSave(formData) {
    if (!user) return
    if (modal?.spot) {
      await supabase.from('spots').update({ name:formData.name, category:formData.category, note:formData.note, note_is_public:formData.note_is_public, is_public:formData.is_public, recommended_by:formData.recommended_by }).eq('id', modal.spot.id)
    } else {
      await supabase.from('spots').insert({ user_id:user.id, ...formData })
    }
    setModal(null); setSelected(null)
    fetchSpots(user.id)
  }

  async function deleteSpot(id) {
    if (!confirm('Delete this spot?')) return
    await supabase.from('spots').delete().eq('id', id)
    setSpots(s => s.filter(x => x.id !== id)); setSelected(null)
  }

  async function togglePublic(spot) {
    await supabase.from('spots').update({ is_public: !spot.is_public }).eq('id', spot.id)
    setSpots(s => s.map(x => x.id === spot.id ? {...x, is_public: !x.is_public} : x))
    setSelected(s => s?.id === spot.id ? {...s, is_public: !s.is_public} : s)
  }

  return (
    <div style={{position:'relative',height:'100dvh',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0}}>
        <MapClient spots={spots} mapClass="map-fullscreen" autoLocate={true} onMapClick={handleMapClick} onSpotClick={s => { setSelected(s); setSheetOpen(true) }} selectedSpot={selected} isOwner={true}/>
      </div>

      {/* Top bar */}
      <div style={{position:'absolute',top:0,left:0,right:0,zIndex:800,padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',pointerEvents:'none'}}>
        <Link href="/" style={{pointerEvents:'auto',background:'#14532d',borderRadius:'12px',padding:'8px 13px',display:'flex',alignItems:'center',gap:'6px',boxShadow:'0 2px 12px rgba(0,0,0,.35)',textDecoration:'none'}}>
          <span style={{fontSize:'16px',color:'white'}}>←</span>
          <span style={{color:'white',fontWeight:700,fontSize:'13px'}}>Community Map</span>
        </Link>
        {username && (
          <Link href={`/${username}`} style={{pointerEvents:'auto',background:'white',borderRadius:'12px',padding:'8px 13px',fontSize:'12px',fontWeight:700,color:'#14532d',boxShadow:'0 2px 12px rgba(0,0,0,.25)',textDecoration:'none'}}>My Page</Link>
        )}
      </div>

      {/* Place pin banner */}
      {placingPin && (
        <div style={{position:'absolute',top:'70px',left:'50%',transform:'translateX(-50%)',background:'#14532d',color:'white',borderRadius:'12px',padding:'10px 18px',fontSize:'13px',fontWeight:700,zIndex:900,boxShadow:'0 4px 16px rgba(0,0,0,.35)',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'10px'}}>
          📍 Tap the map to place your spot
          <button onClick={() => setPlacingPin(false)} style={{background:'rgba(255,255,255,.2)',border:'none',color:'white',borderRadius:'6px',padding:'3px 10px',cursor:'pointer',fontSize:'12px'}}>Cancel</button>
        </div>
      )}

      {/* Add FAB */}
      {!placingPin && !modal && (
        <button onClick={() => setPlacingPin(true)} style={{position:'absolute',bottom:'52vh',right:'16px',zIndex:801,width:'50px',height:'50px',borderRadius:'50%',background:'#f97316',color:'white',border:'none',fontSize:'24px',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
      )}

      {/* Bottom sheet */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,background:'white',borderRadius:'22px 22px 0 0',boxShadow:'0 -4px 30px rgba(0,0,0,.18)',zIndex:800,display:'flex',flexDirection:'column',transform:sheetOpen?'translateY(0)':'translateY(calc(100% - 60px))',transition:'transform .3s cubic-bezier(.25,.8,.25,1)',maxHeight:'50vh'}}>
        <div style={{padding:'10px 16px 0',cursor:'pointer',flexShrink:0}} onClick={() => setSheetOpen(o => !o)}>
          <div style={{width:'36px',height:'4px',background:'#d1d5db',borderRadius:'2px',margin:'0 auto 10px'}}/>
          {selected ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'10px'}}>
              <button onClick={e => { e.stopPropagation(); setSelected(null) }} style={{background:'none',border:'none',color:'#14532d',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>← My Spots</button>
              <span style={{fontSize:'11px',color:'#9ca3af'}}>{selected.category}</span>
            </div>
          ) : (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'10px'}}>
              <span style={{fontWeight:700,fontSize:'15px',color:'#111'}}>My Spots ({spots.length})</span>
              <span style={{fontSize:'11px',color:'#9ca3af'}}>{spots.filter(s=>s.is_public).length} public · {spots.filter(s=>!s.is_public).length} private</span>
            </div>
          )}
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {selected ? (
            <div style={{paddingBottom:'20px'}}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid #f3f4f6'}}>
                <div style={{fontWeight:700,fontSize:'16px',color:'#111',marginBottom:'4px'}}>{selected.name}</div>
                <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'20px',background:selected.is_public?'#dcfce7':'#f3f4f6',color:selected.is_public?'#166534':'#9ca3af'}}>{selected.is_public?'🌍 Public':'🔒 Private'}</span>
                {selected.note && <p style={{fontSize:'13px',color:'#555',marginTop:'8px',lineHeight:1.5}}>{selected.note}</p>}
              </div>
              <div style={{display:'flex',gap:'8px',padding:'12px 16px'}}>
                <button onClick={() => togglePublic(selected)} style={{flex:1,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'10px',fontSize:'12px',fontWeight:700,color:'#166534',cursor:'pointer'}}>{selected.is_public?'🔒 Make Private':'🌍 Make Public'}</button>
                <button onClick={() => setModal({ latlng:{lat:selected.lat,lng:selected.lng}, spot:selected })} style={{flex:1,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'10px',fontSize:'12px',fontWeight:700,color:'#166534',cursor:'pointer'}}>Edit</button>
                <button onClick={() => deleteSpot(selected.id)} style={{flex:1,background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:'10px',padding:'10px',fontSize:'12px',fontWeight:700,color:'#e11d48',cursor:'pointer'}}>Delete</button>
              </div>
            </div>
          ) : spots.length === 0 ? (
            <div style={{padding:'24px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>🗺️</div>
              Tap + to place your first pin on the map
            </div>
          ) : spots.map(s => (
            <div key={s.id} onClick={() => setSelected(s)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 16px',borderBottom:'1px solid #f3f4f6',cursor:'pointer',minHeight:'60px'}}>
              <div style={{fontSize:'22px',flexShrink:0}}>{CAT_EMOJI[s.category]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'14px',color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>
                  <span style={{padding:'1px 6px',borderRadius:'20px',fontWeight:700,fontSize:'10px',background:s.is_public?'#dcfce7':'#f3f4f6',color:s.is_public?'#166534':'#9ca3af'}}>{s.is_public?'🌍':'🔒'}</span> {s.category}
                </div>
              </div>
              <span style={{color:'#d1d5db',fontSize:'18px'}}>›</span>
            </div>
          ))}
        </div>
      </div>

      {modal && <SpotModal spot={modal.spot} latlng={modal.latlng} onSave={handleSave} onClose={() => setModal(null)}/>}
    </div>
  )
}
