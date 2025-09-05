'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to Spotify. To sync playlists, please try again and allow access.';
      case 'invalid_callback':
        return 'Invalid authentication callback. Please try again.';
      case 'token_exchange_failed':
        return 'Failed to authenticate with Spotify. Please try again.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Authentication Failed
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {getErrorMessage(error)}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading...</h2>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
