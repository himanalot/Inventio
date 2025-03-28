import { redirect } from 'next/navigation'

export default function AuthCallbackPage() {
  redirect('/signin')
  return null
} 