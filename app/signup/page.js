'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const RESERVED = ['login','signup','dashboard','api','admin','map','about']

export default function SignupPage() {
  const [form, setForm] = useState({ email:'', password:'', username:'', display_name:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function set(k,v) { setForm(f => ({...f, [k]:v})) }

  async function handleSignup(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const username = form.username.toLowerCase().trim()
    if (!/^[a-z0-9_]{3,30}$/.test(username)) { setError('Username: 3–30 chars, letters/numbers/underscores only.'); setLoading(false); return }
    if (RESERVED.includes(username)) { setError('That username is reserved.'); setLoading(false); return }
    const { data: existing } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
    if (existing) { setError('Username taken.'); setLoading(false); return }
    const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const { error: profileErr } = await supabase.from('profiles').insert({ id: data.user.id, username, display_name: form.display_name.trim() || username })
    if (profileErr) { setError(profileErr.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{minHeight:'100dvh',background:'#f0fdf4',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'24px',textDecoration:'none'}}>
        <span style={{fontSize:'28px'}}>🏔️</span>
        <span style={{fontWeight:700,fontSize:'18px',color:'#14532d'}}>Colorado Family Picks</span>
      </Link>
      <div style={{background:'white',borderRadius:'20px',width:'100%',maxWidth:'360px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.1)'}}>
        <div style={{background:'#14532d',padding:'20px'}}>
          <div style={{fontWeight:700,fontSize:'18px',color:'white'}}>Create your account</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,.65)',marginTop:'2px'}}>Free forever · No credit card needed</div>
        </div>
        <form onSubmit={handleSignup} style={{padding:'20px',display:'flex',flexDirection:'column',gap:'14px'}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Display Name</div>
            <input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="e.g. The Johnson Family"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}/>
          </div>
          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Username *</div>
            <div style={{display:'flex',border:'1.5px solid #e5e7eb',borderRadius:'10px',overflow:'hidden'}}>
              <span style={{background:'#f9fafb',padding:'11px 12px',fontSize:'13px',color:'#9ca3af',borderRight:'1.5px solid #e5e7eb',whiteSpace:'nowrap'}}>site.com/</span>
              <input required value={form.username} onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} placeholder="james"
                style={{flex:1,border:'none',outline:'none',padding:'11px 12px',fontSize:'14px'}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Email *</div>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}/>
          </div>
          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Password *</div>
            <input type="password" required value={form.password} onChange={e => set('password', e.target.value)} minLength={8} placeholder="Min. 8 characters"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}/>
          </div>
          {error && <p style={{color:'#dc2626',fontSize:'13px',margin:0}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{background:'#f97316',color:'white',border:'none',borderRadius:'12px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:loading?.6:1}}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#9ca3af',margin:0}}>
            Already have an account? <Link href="/login" style={{color:'#15803d',fontWeight:700}}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
