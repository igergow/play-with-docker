'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Instance } from '@/lib/types';

interface InstanceDetailsProps {
  instance: Instance;
  onDelete: () => void;
  onOpenEditor: () => void;
  onOpenPort: () => void;
  isDeleting: boolean;
}

export function InstanceDetails({
  instance,
  onDelete,
  onOpenEditor,
  onOpenPort,
  isDeleting,
}: InstanceDetailsProps) {
  const host = typeof window !== 'undefined' ? window.location.host : '';

  const getProxyUrl = (port: number) => {
    const protocol = window.location.protocol;
    return `${protocol}//${instance.proxy_host}-${port}.${host}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>{instance.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IP and Open Port */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="ip">IP</Label>
              <Input id="ip" value={instance.ip} readOnly className="mt-1" />
            </div>
            <Button onClick={onOpenPort} variant="outline">
              Open Port
            </Button>
          </div>

          {/* Ports */}
          {instance.ports && instance.ports.length > 0 && (
            <div>
              <Label className="mb-2 block">Exposed Ports</Label>
              <div className="flex flex-wrap gap-2">
                {instance.ports.map((port) => (
                  <Badge key={port} variant="default">
                    <a
                      href={getProxyUrl(port)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {port}
                    </a>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Swarm Ports */}
          {instance.swarm_ports && instance.swarm_ports.length > 0 && (
            <div>
              <Label className="mb-2 block">Swarm Ports</Label>
              <div className="flex flex-wrap gap-2">
                {instance.swarm_ports.map((port) => (
                  <Badge key={port} variant="secondary">
                    <a
                      href={getProxyUrl(port)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {port}
                    </a>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Memory and CPU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="memory">Memory</Label>
              <Input
                id="memory"
                value={instance.mem || 'N/A'}
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cpu">CPU</Label>
              <Input
                id="cpu"
                value={instance.cpu || 'N/A'}
                readOnly
                className="mt-1"
              />
            </div>
          </div>

          {/* SSH */}
          <div>
            <Label htmlFor="ssh">SSH</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="ssh"
                value={`ssh ${instance.proxy_host}@direct.${host}`}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  copyToClipboard(`ssh ${instance.proxy_host}@direct.${host}`)
                }
                title="Copy"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button variant="outline" onClick={onOpenEditor}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Editor
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

