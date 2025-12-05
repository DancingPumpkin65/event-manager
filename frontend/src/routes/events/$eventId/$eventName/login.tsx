import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { Alert, Button, Card, Input } from '@/components/ui'
import { apiClient } from '@/lib/api-client'
import { useStaffAuth } from '@/context/StaffContext'
import { getEventQueryOptions } from '@/features/event/hooks/query-options'
import { UserStar, Lock, LogIn } from 'lucide-react'


export const Route = createFileRoute(
  '/events/$eventId/$eventName/login',
)({
  loader: async ({ context, params }) => {
    // Try to prefetch event data, but don't block if it fails
    try {
      await context.queryClient.ensureQueryData(
        getEventQueryOptions(params.eventId),
      )
    } catch {
      // Ignore errors - component will handle it
    }
  },
  component: StaffLoginPage,
})

function StaffLoginPage() {
  const navigate = useNavigate()
  const { eventId, eventName } = Route.useParams()
  const { data: event } = useQuery(getEventQueryOptions(eventId))

  const { login } = useStaffAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.staffLogin({
        username,
        password,
        eventId,
      })

      login(response.staff)

      navigate({
        to: '/events/$eventId/$eventName/staff-portal',
        params: { eventId, eventName },
      })
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : 'Invalid credentials',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-balance">
            Staff Portal
          </h1>
          <p className="text-gray-600">{event?.name || decodeURIComponent(eventName)}</p>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center justify-center">
          <Input
            id="username"
            type="text"
            label='Username'
            placeholder="staff"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
            fullWidth
            leftIcon={<UserStar className="w-5 h-5 mr-2" />}
          />

          <Input
            id="password"
            type="password"
            label='Password'
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            leftIcon={<Lock className="w-5 h-5 mr-2" />}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            leftIcon={<LogIn className="w-5 h-5 mr-2" />}
            className="!py-2 !px-6"
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  )
}
