'use client';

import React from 'react';
import { useSession } from '@/lib/contexts/SessionContext';
import { cn } from '@/lib/utils';

export function InstanceList() {
  const { instances, selectedInstance, selectInstance } = useSession();

  if (instances.length === 0) {
    return (
      <div className="p-4 text-gray-300 text-sm text-center">
        No instances yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {instances
        .sort((a, b) => a.hostname.localeCompare(b.hostname))
        .map((instance) => (
          <button
            key={instance.name}
            onClick={() => selectInstance(instance)}
            className={cn(
              'w-full text-left p-3 rounded transition-colors',
              selectedInstance?.name === instance.name
                ? 'bg-indigo-700'
                : 'hover:bg-indigo-800'
            )}
          >
            <div className="flex items-start gap-2">
              {/* Manager Icon */}
              <div className="mt-1">
                {instance.is_manager || instance.is_k8s_manager ? (
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>

              {/* Instance Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{instance.ip}</div>
                <div className="text-sm text-gray-300 truncate">{instance.hostname}</div>
              </div>
            </div>
          </button>
        ))}
    </div>
  );
}

