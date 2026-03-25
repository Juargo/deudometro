// Auth middleware — redirects unauthenticated users to /login
export default defineNuxtRouteMiddleware(async () => {
  // Skip on server — auth state only available on client
  if (import.meta.server) return

  const { user, loading, init } = useAuth()
  await init()

  // Wait for auth to resolve
  if (loading.value) return

  if (!user.value) {
    return navigateTo('/login')
  }
})
