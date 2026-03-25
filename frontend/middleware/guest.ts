// Guest middleware — redirects authenticated users away from login/register
export default defineNuxtRouteMiddleware(async () => {
  const { user, init } = useAuth()
  await init()

  if (user.value) {
    return navigateTo('/dashboard')
  }
})
