import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function McpAuth() {
  const [params] = useSearchParams()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      const client_id = params.get('client_id')
      const redirect_uri = params.get('redirect_uri')
      const code_challenge = params.get('code_challenge')
      const scope = params.get('scope') || ''
      const state = params.get('state')

      const mcpState = btoa(JSON.stringify({
        mcp_authorize: '1',
        client_id,
        redirect_uri,
        code_challenge,
        scope,
        oauth_state: state || '',
      })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
      window.location.href = `/auth/google?state=${encodeURIComponent(mcpState)}`
      return
    }

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/authorize'

    const fields: Record<string, string | null> = {
      client_id: params.get('client_id'),
      redirect_uri: params.get('redirect_uri'),
      response_type: params.get('response_type'),
      code_challenge: params.get('code_challenge'),
      code_challenge_method: params.get('code_challenge_method'),
      state: params.get('state'),
      scope: params.get('scope'),
      token,
    }
    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }
    }

    document.body.appendChild(form)
    form.submit()
  }, [params])

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-text-muted">Completing authorization...</p>
    </div>
  )
}
