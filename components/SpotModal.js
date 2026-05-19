'use client'
import { useState, useEffect } from 'react'

const CATEGORIES = ['Hiking','Swimming','Skiing/Snow','Camping','Wildlife','Museums','Attractions','Family Dining','Other']
const EMOJIS = {'Hiking':'🏔️','Swimming':'🏊','Skiing/Snow':'⛷️','Camping':'🏕️','Wildlife':'🦁','Museums':'🏛️','Attractions':'🎡','Family Dining':'🍕','Other':'📍'}
const BLANK = { name:'', category:'Hiking', note:'', note_is_public:true, is_public:true, recommended_by:'' }

export default function SpotModal({ spot, latlng, onSave, onClose }) {
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setForm(spot ? {...spot} : BLANK); setError('') }, [spot])

  function set(k, v) { setForm(f => ({...f, [k]: v})) }

  async function handleSave() {
    if (!form.name.trim()) { setError('Please enter a place name.'); return }
    if (!latlng) { setError('No location set — go back and tap the map first.'); return }
    setSaving(true); setError('')
    try { await onSave({...form, lat: latlng.lat, lng: latlng.lng}) }
    catch(e) { setError(e.message || 'Something went wrong.') }
    finally { setSaving(false) }
  }

  return (
    <div
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={e => { if(e.target===e.currentTarget) onClose() }}
    >
      <div style={{background:'white',borderRadius:'22px 22px 0 0',width:'100%',maxWidth:'500px',maxHeight:'90vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:'#14532d',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <h2 style={{color:'white',fontWeight:700,fontSize:'16px',margin:0}}>{spot ? 'Edit Spot' : '📍 Add a Spot'}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,.7)',fontSize:'20px',cursor:'pointer',lineHeight:1}}>✕</button>
        </div>

        <div style={{overflowY:'auto',flex:1,padding:'20px',display:'flex',flexDirection:'column',gap:'16px'}}>
          {latlng && (
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'10px 14px',fontSize:'12px',color:'#166534',fontWeight:600}}>
              📍 Location set: {latlng.lat.toFixed(4)}, {latlng.lng.toFixed(4)}
            </div>
          )}

          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Place Name *</div>
            <input
              value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Rocky Mountain National Park"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}
            />
          </div>

          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Category</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => set('category', cat)}
                  style={{border:`2px solid ${form.category===cat?'#14532d':'#e5e7eb'}`,background:form.category===cat?'#14532d':'white',color:form.category===cat?'white':'#555',borderRadius:'10px',padding:'10px 4px',fontSize:'11px',fontWeight:700,cursor:'pointer',transition:'all .15s'}}>
                  <div style={{fontSize:'18px',marginBottom:'3px'}}>{EMOJIS[cat]}</div>{cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
              <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af'}}>Note</div>
              <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#6b7280',cursor:'pointer'}}>
                <input type="checkbox" checked={form.note_is_public} onChange={e => set('note_is_public', e.target.checked)} style={{accentColor:'#14532d'}}/>
                Public
              </label>
            </div>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3}
              placeholder="Why do you love this place? Great for ages 5+…"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',resize:'none'}}/>
          </div>

          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Recommended by</div>
            <input value={form.recommended_by} onChange={e => set('recommended_by', e.target.value)}
              placeholder="e.g. Grandma, NPS Ranger…"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}/>
          </div>

          <div style={{background:form.is_public?'#f0fdf4':'#f9fafb',border:`1px solid ${form.is_public?'#bbf7d0':'#e5e7eb'}`,borderRadius:'12px',padding:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
            <input type="checkbox" id="pub" checked={form.is_public} onChange={e => set('is_public', e.target.checked)} style={{width:'18px',height:'18px',accentColor:'#14532d',flexShrink:0}}/>
            <label htmlFor="pub" style={{cursor:'pointer'}}>
              <div style={{fontWeight:700,fontSize:'14px',color:'#111'}}>{form.is_public?'🌍 Public spot':'🔒 Private spot'}</div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'2px'}}>{form.is_public?'Visible on the community map':'Only visible to you'}</div>
            </label>
          </div>

          {error && <p style={{color:'#dc2626',fontSize:'13px',margin:0}}>{error}</p>}
        </div>

        <div style={{padding:'14px 20px',borderTop:'1px solid #f3f4f6',display:'flex',gap:'10px',flexShrink:0}}>
          <button onClick={onClose} style={{border:'1.5px solid #e5e7eb',background:'none',borderRadius:'12px',padding:'13px 20px',fontSize:'14px',fontWeight:700,color:'#6b7280',cursor:'pointer'}}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{flex:1,background:'#14532d',color:'white',border:'none',borderRadius:'12px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:saving?.6:1}}>
            {saving ? 'Saving…' : spot ? 'Save Changes ✓' : 'Add Spot ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
