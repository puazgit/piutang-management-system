import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { NextRequest } from 'next/server'

export async function getAuthSession(request?: NextRequest) {
  try {
    if (request) {
      // For App Router API routes
      const session = await getServerSession(authOptions)
      return session
    }
    
    // For server components
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export function validateAuth(session: { user?: { id?: string } } | null): boolean {
  return !!(session && session.user && session.user.id)
}