'use client'

import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Временно убираем SessionProvider до полной настройки NextAuth
  return <>{children}</>
}