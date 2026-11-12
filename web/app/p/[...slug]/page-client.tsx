'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/playground/Sidebar';
import { InstanceDetails } from '@/components/playground/InstanceDetails';
import { Terminal } from '@/components/playground/Terminal';
import { SessionBuilder } from '@/components/playground/SessionBuilder';
import {
  SessionProvider,
  useSession,
} from '@/lib/contexts/SessionContext';
import { WebSocketProvider, useWebSocket } from '@/lib/contexts/WebSocketContext';
import { PlaygroundProvider, usePlayground } from '@/lib/contexts/PlaygroundContext';
import { api } from '@/lib/api';
import type { Instance, InstanceStats } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

function PlaygroundContent({ sessionId }: { sessionId: string }) {
  const {
    session,
    instances,
    selectedInstance,
    isAlive,
    ttl,
    setSession,
    setInstances,
    addInstance,
    updateInstance,
    removeInstance,
    selectInstance,
  } = useSession();
  const { ws, connected } = useWebSocket();
  const { playground } = usePlayground();
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [isDeletingInstance, setIsDeletingInstance] = useState<string | null>(null);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [showPortDialog, setShowPortDialog] = useState(false);
  const [portToOpen, setPortToOpen] = useState('');

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await api.getSession(sessionId);
      setSession(data);

      // If session has a stack, show builder
      if (data.stack) {
        setShowSessionBuilder(true);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    if (!ws) return;

    const handleInstanceNew = (instance: Instance) => {
      addInstance(instance);
      if (!selectedInstance) {
        selectInstance(instance);
      }
    };

    const handleInstanceDelete = (instanceName: string) => {
      removeInstance(instanceName);
    };

    const handleInstanceStats = (stats: InstanceStats[]) => {
      stats.forEach((stat) => {
        updateInstance(stat.name, {
          mem: stat.mem,
          cpu: stat.cpu,
          is_manager: stat.is_manager,
          is_k8s_manager: stat.is_k8s_manager,
        });
      });
    };

    const handleInstancePort = (
      instanceName: string,
      port: number,
      servicePort: number
    ) => {
      const instance = instances.find((i) => i.name === instanceName);
      if (instance) {
        const ports = instance.ports || [];
        if (!ports.includes(port)) {
          updateInstance(instanceName, { ports: [...ports, port] });
        }
      }
    };

    const handleInstanceSwarmPort = (
      instanceName: string,
      port: number,
      servicePort: number
    ) => {
      const instance = instances.find((i) => i.name === instanceName);
      if (instance) {
        const swarmPorts = instance.swarm_ports || [];
        if (!swarmPorts.includes(port)) {
          updateInstance(instanceName, { swarm_ports: [...swarmPorts, port] });
        }
      }
    };

    const handleSessionReady = () => {
      setShowSessionBuilder(false);
    };

    const handleSessionEnd = () => {
      // Session ended
    };

    ws.on('instance new', handleInstanceNew);
    ws.on('instance delete', handleInstanceDelete);
    ws.on('instance stats', handleInstanceStats);
    ws.on('instance port', handleInstancePort);
    ws.on('instance swarm port', handleInstanceSwarmPort);
    ws.on('session ready', handleSessionReady);
    ws.on('session end', handleSessionEnd);

    return () => {
      ws.off('instance new', handleInstanceNew);
      ws.off('instance delete', handleInstanceDelete);
      ws.off('instance stats', handleInstanceStats);
      ws.off('instance port', handleInstancePort);
      ws.off('instance swarm port', handleInstanceSwarmPort);
      ws.off('session ready', handleSessionReady);
      ws.off('session end', handleSessionEnd);
    };
  }, [ws, addInstance, removeInstance, updateInstance, selectInstance, selectedInstance, instances]);

  const handleNewInstance = async () => {
    if (!session?.id) return;

    setIsCreatingInstance(true);
    try {
      const desiredImage = localStorage.getItem('desiredInstanceImage') || undefined;
      const instance = await api.createInstance(session.id, {
        image_name: desiredImage,
      });
      addInstance(instance);
      if (!selectedInstance) {
        selectInstance(instance);
      }
    } catch (error) {
      console.error('Failed to create instance:', error);
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleDeleteInstance = async (instance: Instance) => {
    if (!session?.id) return;

    setIsDeletingInstance(instance.name);
    try {
      await api.deleteInstance(session.id, instance.name);
      removeInstance(instance.name);
    } catch (error) {
      console.error('Failed to delete instance:', error);
    } finally {
      setIsDeletingInstance(null);
    }
  };

  const handleOpenPort = () => {
    setShowPortDialog(true);
  };

  const handleOpenPortSubmit = async () => {
    if (!selectedInstance || !session?.id || !portToOpen) return;

    try {
      await api.execCommand(
        session.id,
        selectedInstance.name,
        `docker run -d -p ${portToOpen}:${portToOpen} alpine sleep 3600`
      );
      setShowPortDialog(false);
      setPortToOpen('');
    } catch (error) {
      console.error('Failed to open port:', error);
    }
  };

  const handleOpenEditor = () => {
    if (!selectedInstance || !session?.id) return;
    window.open(
      `/sessions/${session.id}/instances/${selectedInstance.name}/editor`,
      '_blank'
    );
  };

  if (!isAlive) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900 mb-4">
            Your session has expired.
          </p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No connection to server. Reconnecting...</h1>
          <Progress className="w-64 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        onNewInstance={handleNewInstance}
        isCreatingInstance={isCreatingInstance}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {instances.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-gray-600 mb-2">Add instances to your playground.</p>
              <p className="text-sm text-gray-500">
                <strong>Sessions and all their instances are deleted after {ttl} hours.</strong>
              </p>
            </div>
          </div>
        ) : selectedInstance ? (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
            <InstanceDetails
              instance={selectedInstance}
              onDelete={() => handleDeleteInstance(selectedInstance)}
              onOpenEditor={handleOpenEditor}
              onOpenPort={handleOpenPort}
              isDeleting={isDeletingInstance === selectedInstance.name}
            />
            <div className="flex-1 min-h-0">
              <Terminal instanceName={selectedInstance.name} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600">Select an instance to view details</p>
          </div>
        )}
      </main>

      {/* Session Builder Modal */}
      {showSessionBuilder && (
        <SessionBuilder
          open={showSessionBuilder}
          onClose={() => setShowSessionBuilder(false)}
        />
      )}

      {/* Open Port Dialog */}
      <Dialog open={showPortDialog} onOpenChange={setShowPortDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Port</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="number"
              placeholder="Port number"
              value={portToOpen}
              onChange={(e) => setPortToOpen(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <Button onClick={handleOpenPortSubmit}>Open</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PlaygroundPageClient({
  params,
}: {
  params: { slug: string[] };
}) {
  const sessionId = params.slug?.[0] || '';
  
  if (!sessionId) {
    return <div>Invalid session ID</div>;
  }

  return (
    <PlaygroundProvider>
      <SessionProvider sessionId={sessionId}>
        <WebSocketProvider sessionId={sessionId}>
          <PlaygroundContent sessionId={sessionId} />
        </WebSocketProvider>
      </SessionProvider>
    </PlaygroundProvider>
  );
}

