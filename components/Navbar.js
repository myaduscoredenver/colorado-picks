'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const [user, setUser]       = useState(null)
  const [username, setUsername] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUsername(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchUsername(session.user.id)
      else setUsername(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchUsername(uid) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', uid)
      .single()
    if (data) setUsername(data.username)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="h-16 bg-forest-900 text-white flex items-center justify-between px-6 shadow-lg z-50 relative">
      <Link href="/" className="flex items-center gap-2 font-heading font-700">
        <span className="text-2xl">🏔️</span>
        <span className="font-heading font-bold text-lg tracking-wide">Colorado Family Picks</span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-forest-100 hover:text-white transition-colors"
            >
              My Spots
            </Link>
            <Link
              href={`/${username}`}
              className="text-sm font-semibold text-forest-100 hover:text-white transition-colors"
            >
              My Page
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-semibold text-forest-100 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-orange-500 hover:bg-orange-400 px-4 py-1.5 rounded-lg font-bold transition-colors"
            >
              Sign Up Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
