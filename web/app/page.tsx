'use client';

import React, { useState, useEffect } from 'react';
import { Hero } from '@/components/landing/Hero';
import { Description } from '@/components/landing/Description';
import { PlaygroundProvider, usePlayground } from '@/lib/contexts/PlaygroundContext';
import { api } from '@/lib/api';

function LandingContent() {
  const { playground, loading } = usePlayground();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkLoggedIn();
  }, []);

  const checkLoggedIn = async () => {
    try {
      await api.getCurrentUser();
      setLoggedIn(true);
    } catch (error) {
      setLoggedIn(false);
    } finally {
      setChecking(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!playground) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load playground configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <nav className="flex justify-end">
            <a
              href="https://github.com/play-with-docker/play-with-docker"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contribute
            </a>
          </nav>
        </header>

        {/* Hero Section */}
        <Hero
          playground={playground}
          loggedIn={loggedIn}
          onLoginSuccess={() => checkLoggedIn()}
        />

        {/* Description Section */}
        <Description playground={playground} />

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600">
          <p>
            &copy; {playground.id.includes('k8s') ? 'Play with Kubernetes' : 'Play with Docker'}{' '}
            2017 - {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <PlaygroundProvider>
      <LandingContent />
    </PlaygroundProvider>
  );
}
