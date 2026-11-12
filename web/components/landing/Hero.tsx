'use client';

import React from 'react';
import { LoginButton } from './LoginButton';
import { NicknameLogin } from './NicknameLogin';
import type { Playground } from '@/lib/types';

interface HeroProps {
  playground: Playground;
  loggedIn: boolean;
  onLoginSuccess: () => void;
}

export function Hero({ playground, loggedIn, onLoginSuccess }: HeroProps) {
  const isDocker = playground.id.includes('docker') || !playground.id.includes('k8s');
  
  const logoUrl = isDocker
    ? 'https://galaxyproject.github.io/training-material/topics/admin/images/docker_whale.png'
    : 'https://avatars.githubusercontent.com/u/13629408?v=4';

  const title = isDocker ? 'Play with Docker' : 'Play with Kubernetes';
  const subtitle = isDocker
    ? 'A simple, interactive and fun playground to learn Docker'
    : 'A simple, interactive and fun playground to learn Kubernetes';

  const handleStart = () => {
    // Get query parameters
    const params = new URLSearchParams(window.location.search);
    const stack = params.get('stack');
    const stackName = params.get('stack_name');
    const imageName = params.get('image_name');

    // Create form and submit
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/';

    if (stack) {
      const stackInput = document.createElement('input');
      stackInput.type = 'hidden';
      stackInput.name = 'stack';
      stackInput.value = stack;
      form.appendChild(stackInput);
    }

    if (stackName) {
      const stackNameInput = document.createElement('input');
      stackNameInput.type = 'hidden';
      stackNameInput.name = 'stack_name';
      stackNameInput.value = stackName;
      form.appendChild(stackNameInput);
    }

    if (imageName) {
      const imageNameInput = document.createElement('input');
      imageNameInput.type = 'hidden';
      imageNameInput.name = 'image_name';
      imageNameInput.value = imageName;
      form.appendChild(imageNameInput);
    }

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <div className="text-center">
        <img
          src={logoUrl}
          alt={title}
          className="mx-auto mb-6 h-32 w-auto"
        />
        <h1 className="text-5xl font-bold mb-4 text-gray-900">{title}</h1>
        <p className="text-xl text-gray-600 mb-8">{subtitle}</p>

        {!loggedIn ? (
          <div className="space-y-4">
            <LoginButton onLoginSuccess={onLoginSuccess} />
            <div className="text-gray-500">or</div>
            <NicknameLogin onLoginSuccess={onLoginSuccess} />
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-8 py-3 text-lg font-medium text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}

