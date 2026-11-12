'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';

interface LoginButtonProps {
  onLoginSuccess: () => void;
}

export function LoginButton({ onLoginSuccess }: LoginButtonProps) {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await api.getOAuthProviders();
      setProviders(data);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (provider: string) => {
    const width = screen.width * 0.6;
    const height = 620;
    const x = screen.width / 2 - width / 2;
    const y = screen.height / 2 - height / 2;

    const loginWindow = window.open(
      `/oauth/providers/${provider}/login`,
      'PWDLogin',
      `width=${width},height=${height},left=${x},top=${y}`
    );

    // Listen for message from popup
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'done') {
        window.removeEventListener('message', handleMessage);
        onLoginSuccess();
      }
    };

    window.addEventListener('message', handleMessage);
  };

  if (loading || providers.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Login
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {providers.map((provider) => (
          <DropdownMenuItem
            key={provider}
            onClick={() => handleLogin(provider)}
            className="capitalize cursor-pointer"
          >
            {provider}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

