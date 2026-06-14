import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { useIsMobile } from '#/lib/use-is-mobile'
import { LogoChip } from '#/components/LogoChip'
import { Icon } from '#/components/Icon'

export const Route = createFileRoute('/admin/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const mobile = useIsMobile()
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

  const fields = (
    <>
      <label className="field-label">E-mail</label>
      <div className={mobile ? 'am-pw' : 'adm-pw'}>
        <Icon name="mail" size={18} />
        <input
          type="email"
          autoComplete="username"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          required
        />
      </div>
      <label className="field-label">Mot de passe</label>
      <div className={mobile ? 'am-pw' : 'adm-pw'}>
        <Icon name="lock" size={18} />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          required
        />
      </div>
      {error ? (
        <div className={mobile ? 'am-err' : 'adm-err'}>{error}</div>
      ) : null}
      <button
        className="btn btn-primary btn-block btn-lg"
        type="submit"
        disabled={busy}
      >
        {busy ? 'Connexion…' : 'Se connecter'}
        <Icon name="arrow-r" size={18} stroke={2.4} />
      </button>
    </>
  )

  if (mobile) {
    return (
      <div className="adm-m">
        <div className="am-login">
          <div className="am-login-grid" />
          <form className="am-login-card" onSubmit={submit}>
            <div className="all-brand">
              <LogoChip />
              <div>
                <b>NSDPF</b>
                <span>Administration</span>
              </div>
            </div>
            <h1>Espace administration</h1>
            <p>Gérez le catalogue, les gammes et les coordonnées de NSDPF.</p>
            {fields}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin">
      <div className="adm-login">
        <div className="adm-login-grid" />
        <form className="adm-login-card" onSubmit={submit}>
          <div className="all-brand">
            <LogoChip />
            <div>
              <b>NSDPF</b>
              <span>Administration</span>
            </div>
          </div>
          <h1>Espace administration</h1>
          <p>Gérez le catalogue, les gammes et les coordonnées de NSDPF.</p>
          {fields}
        </form>
      </div>
    </div>
  )
}
