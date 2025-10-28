export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useNuxtApp().$supabase;

  if (!supabase) {
    return navigateTo('/login');
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return navigateTo('/login');
  }
});