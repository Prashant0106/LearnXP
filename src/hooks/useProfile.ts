import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  name: string
  avatar: string
  xp: number
  level: number
  streak: number
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      // Create profile if it doesn't exist
      const newProfile = {
        id: user.id,
        name: user.email?.split('@')[0] || 'Student',
        avatar: '',
        xp: 0,
        level: 1,
        streak: 0,
      }
      await supabase.from('profiles').insert(newProfile)
      setProfile(newProfile)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  const addXP = async (amount: number) => {
    if (!profile) return
    const newXP = profile.xp + amount
    const newLevel = Math.floor(newXP / 1000) + 1

    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, xp: newXP, level: newLevel } : null)
    }
  }

  return { profile, loading, addXP }
}