/**
 * Crée le compte admin initial via l'API better-auth du dev server.
 * Prérequis : `bun run dev` doit tourner sur http://localhost:3000.
 * Identifiants temporaires — à changer après la première connexion.
 */
const BASE = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@nsdpf.local'
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'ChangeMoi!2026'

async function main() {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ name: 'Admin NSDPF', email: EMAIL, password: PASSWORD }),
  })
  const body = await res.text()

  if (res.ok) {
    console.log(`Compte admin créé : ${EMAIL} (mot de passe temporaire : ${PASSWORD})`)
    console.log('⚠️  Changez ce mot de passe après la première connexion.')
    return
  }

  if (res.status === 422 || /already.exists|user_already_exists/i.test(body)) {
    console.log(`Compte admin déjà existant : ${EMAIL} — rien à faire.`)
    return
  }

  console.error(`Échec (${res.status}): ${body}`)
  process.exit(1)
}

main()
