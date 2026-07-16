// JusFlow - Helper: fetch com header de identificação do usuário
// Todas as chamadas de API que modificam dados devem usar este helper
// para que o log de auditoria registre quem fez o quê

export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

/**
 * fetch com header X-User-Info para o backend registrar no log de auditoria
 */
export function fetchWithUser(
  user: UserInfo | null,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!user) return fetch(url, options)

  const headers = new Headers(options.headers)
  headers.set('X-User-Info', JSON.stringify({
    name: user.name,
    email: user.email,
    role: user.role,
  }))

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * GET com userInfo (opcional - GETs não precisam de auditoria normalmente)
 */
export function getUser(
  user: UserInfo | null,
  url: string
): Promise<Response> {
  return fetch(url)
}

/**
 * POST com userInfo
 */
export function postWithUser(
  user: UserInfo | null,
  url: string,
  body: unknown
): Promise<Response> {
  return fetchWithUser(user, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * PATCH com userInfo
 */
export function patchWithUser(
  user: UserInfo | null,
  url: string,
  body: unknown
): Promise<Response> {
  return fetchWithUser(user, url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * DELETE com userInfo
 */
export function deleteWithUser(
  user: UserInfo | null,
  url: string
): Promise<Response> {
  return fetchWithUser(user, url, {
    method: 'DELETE',
  })
}