// Auth middleware — redirects unauthenticated users to /login
export default defineNuxtRouteMiddleware(async () => {
  const { user, loading, init } = useAuth()
  await init()

  // Wait for auth to resolve
  if (loading.value) return

  if (!user.value) {
    return navigateTo('/login')
  }
})
