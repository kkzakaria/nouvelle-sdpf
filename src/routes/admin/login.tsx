import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/admin/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { error: err } = await authClient.signIn.email({ email, password })
      if (err) {
        setError('Identifiants invalides.')
        return
      }
      navigate({ to: '/admin' })
    } catch {
      setError('Impossible de se connecter pour le moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-card admin-login-card" onSubmit={submit}>
        <h1>Administration NSDPF</h1>
        <label className="admin-field">
          <span>E-mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="admin-field">
          <span>Mot de passe</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="admin-error">{error}</p> : null}
        <button className="btn btn-brand" type="submit" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
