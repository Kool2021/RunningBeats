'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect back to results page after a short delay
    const timer = setTimeout(() => {
      router.back();
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Authentication Successful!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You&apos;ve been connected to Spotify. You can now sync playlists to your account.
        </p>
        <button
          onClick={() => router.back()}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
