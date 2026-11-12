'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface NicknameLoginProps {
  onLoginSuccess: () => void;
}

export function NicknameLogin({ onLoginSuccess }: NicknameLoginProps) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.nicknameLogin(nickname.trim());
      onLoginSuccess();
    } catch (err) {
      console.error('Nickname login failed:', err);
      setError('Failed to login with nickname');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 max-w-sm mx-auto">
      <div className="w-full">
        <Label htmlFor="nickname" className="text-sm text-gray-600">
          Enter a nickname to get started quickly
        </Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="nickname"
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !nickname.trim()}>
            {loading ? 'Logging in...' : 'Go'}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    </form>
  );
}

