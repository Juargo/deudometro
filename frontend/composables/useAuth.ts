// Auth composable — wraps Supabase Auth with reactive state
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)

export function useAuth() {
  const { $supabase } = useNuxtApp()

  async function init() {
    if (initialized.value) return
    initialized.value = true
    loading.value = true

    const { data } = await $supabase.auth.getSession()
    user.value = data.session?.user ?? null
    loading.value = false

    // Listen for auth state changes (login, logout, token refresh)
    $supabase.auth.onAuthStateChange((_event: string, session: any) => {
      user.value = session?.user ?? null
    })
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await $supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await $supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  async function getAccessToken(): Promise<string | null> {
    const { data } = await $supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  return { user, loading, init, signUp, signIn, signOut, getAccessToken }
}
