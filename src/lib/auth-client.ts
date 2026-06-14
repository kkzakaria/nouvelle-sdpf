import { createAuthClient } from 'better-auth/react'

// baseURL par défaut = origine courante ; l'app et l'API /api/auth sont
// servies depuis le même domaine.
export const authClient = createAuthClient()
