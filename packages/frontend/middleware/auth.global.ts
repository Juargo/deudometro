import { useAuthStore } from '~/stores/auth.store';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (authStore.isLoading) {
    await authStore.initialize();
  }

  const isPublic = publicRoutes.includes(to.path) || to.path.startsWith('/invite/');

  if (!authStore.isAuthenticated && !isPublic) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/dashboard');
  }
});
