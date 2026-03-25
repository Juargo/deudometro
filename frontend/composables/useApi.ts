// API composable — typed fetch wrapper with JWT auth
export function useApi() {
  const config = useRuntimeConfig()
  const { getAccessToken } = useAuth()

  async function api<T = unknown>(
    path: string,
    options: { method?: string; body?: unknown; query?: Record<string, string | number> } = {}
  ): Promise<T> {
    const token = await getAccessToken()
    const url = new URL(path, config.public.apiBaseUrl)

    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v != null && v !== '') url.searchParams.set(k, String(v))
      }
    }

    const res = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    })

    const data = await res.json()

    if (!res.ok) {
      const err = new Error(data.message ?? data.error ?? 'API error')
      ;(err as any).status = res.status
      ;(err as any).data = data
      throw err
    }

    return data as T
  }

  return { api }
}
