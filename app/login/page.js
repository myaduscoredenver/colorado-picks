'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{minHeight:'100dvh',background:'#f0fdf4',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'24px',textDecoration:'none'}}>
        <span style={{fontSize:'28px'}}>🏔️</span>
        <span style={{fontWeight:700,fontSize:'18px',color:'#14532d'}}>Colorado Family Picks</span>
      </Link>
      <div style={{background:'white',borderRadius:'20px',width:'100%',maxWidth:'360px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,.1)'}}>
        <div style={{background:'#14532d',padding:'20px'}}>
          <div style={{fontWeight:700,fontSize:'18px',color:'white'}}>Welcome back</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,.65)',marginTop:'2px'}}>Log in to manage your spots</div>
        </div>
        <form onSubmit={handleLogin} style={{padding:'20px',display:'flex',flexDirection:'column',gap:'14px'}}>
          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Email</div>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}/>
          </div>
          <div>
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'#9ca3af',marginBottom:'6px'}}>Password</div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none'}}/>
          </div>
          {error && <p style={{color:'#dc2626',fontSize:'13px',margin:0}}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{background:'#14532d',color:'white',border:'none',borderRadius:'12px',padding:'13px',fontSize:'14px',fontWeight:700,cursor:'pointer',opacity:loading?.6:1}}>
            {loading ? 'Logging in…' : 'Log In →'}
          </button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#9ca3af',margin:0}}>
            No account? <Link href="/signup" style={{color:'#15803d',fontWeight:700}}>Sign up free</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
