'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSession } from '@/lib/contexts/SessionContext';
import { usePlayground } from '@/lib/contexts/PlaygroundContext';
import { InstanceList } from './InstanceList';
import { SettingsModal } from './SettingsModal';
import { TemplatesModal } from './TemplatesModal';

interface SidebarProps {
  onNewInstance: () => void;
  isCreatingInstance: boolean;
}

export function Sidebar({ onNewInstance, isCreatingInstance }: SidebarProps) {
  const { ttl, closeSession } = useSession();
  const { playground } = usePlayground();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);

  return (
    <>
      <aside className="w-80 bg-indigo-900 text-white flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 bg-indigo-800">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold mb-2">{ttl}</div>
            <Button
              variant="destructive"
              onClick={closeSession}
              className="w-full"
            >
              Close session
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Instances</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="p-2 hover:bg-indigo-700 rounded"
                title="Templates"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-indigo-700 rounded"
                title="Settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* New Instance Button */}
        <div className="p-4">
          <Button
            onClick={onNewInstance}
            disabled={isCreatingInstance}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingInstance ? 'Creating...' : '+ Add new instance'}
          </Button>
        </div>

        {/* Instance List */}
        <div className="flex-1 overflow-y-auto">
          <InstanceList />
        </div>
      </aside>

      {/* Modals */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <TemplatesModal open={showTemplates} onClose={() => setShowTemplates(false)} />
    </>
  );
}

