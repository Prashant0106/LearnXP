import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  name: string
  avatar: string
  xp: number
  level: number
  streak: number
  last_seen: string | null
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
      const newProfile = {
        id: user.id,
        name: user.email?.split('@')[0] || 'Student',
        avatar: '',
        xp: 0,
        level: 1,
        streak: 0,
        last_seen: null,
      }
      await supabase.from('profiles').insert(newProfile)
      setProfile(newProfile)
    } else {
      // Update streak
      const updatedProfile = await updateStreak(data)
      setProfile(updatedProfile)
    }
    setLoading(false)
  }

  const updateStreak = async (data: Profile) => {
    const today = new Date().toISOString().split('T')[0]
    const lastSeen = data.last_seen

    let newStreak = data.streak || 0

    if (!lastSeen) {
      // First time login
      newStreak = 1
    } else if (lastSeen === today) {
      // Already logged in today — don't change streak
      return data
    } else {
      const lastDate = new Date(lastSeen)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day — increase streak
        newStreak = (data.streak || 0) + 1
      } else {
        // Streak broken — reset to 1
        newStreak = 1
      }
    }

    const { data: updated } = await supabase
      .from('profiles')
      .update({ streak: newStreak, last_seen: today })
      .eq('id', data.id)
      .select()
      .single()

    return updated || { ...data, streak: newStreak, last_seen: today }
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

      // Check and award badges automatically
      await supabase.rpc('check_and_award_badges', { user_id: profile.id })
    }
  }

  return { profile, loading, addXP }
}