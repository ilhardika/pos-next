'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function VerifyEmailPage() {
  const [isVerified, setIsVerified] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if user is already verified
    if (user?.email_confirmed_at) {
      setIsVerified(true)
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-center">
              Your account has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-center">
            We've sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="mb-4">
            <Mail className="h-12 w-12 mx-auto text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-sm">
              {user?.email || 'your email address'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and complete the setup.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
