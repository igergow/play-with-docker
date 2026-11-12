'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TerminalService } from '@/lib/terminal';
import { useWebSocket } from '@/lib/contexts/WebSocketContext';
import '@xterm/xterm/css/xterm.css';

interface SessionBuilderProps {
  open: boolean;
  onClose: () => void;
}

export function SessionBuilder({ open, onClose }: SessionBuilderProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalServiceRef = useRef<TerminalService | null>(null);
  const { ws } = useWebSocket();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open || !terminalRef.current || terminalServiceRef.current) return;

    const terminal = new TerminalService({
      fontSize: 12,
    });

    terminalServiceRef.current = terminal;
    terminal.open(terminalRef.current);

    // Handle builder output
    const handleBuilderOut = (data: string) => {
      if (terminalServiceRef.current) {
        terminalServiceRef.current.write(data);
      }
    };

    const handleSessionReady = () => {
      setReady(true);
    };

    if (ws) {
      ws.on('session builder out', handleBuilderOut);
      ws.on('session ready', handleSessionReady);
    }

    // Fit terminal
    setTimeout(() => {
      terminal.fit();
    }, 100);

    return () => {
      if (ws) {
        ws.off('session builder out', handleBuilderOut);
        ws.off('session ready', handleSessionReady);
      }
      terminal.dispose();
      terminalServiceRef.current = null;
      setReady(false);
    };
  }, [open, ws]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Session stack builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            We are building your stack. This might take a while.
          </div>

          <div
            ref={terminalRef}
            className="w-full h-[450px] bg-black rounded"
            style={{ padding: '8px' }}
          />

          {ready && (
            <div className="text-center font-bold text-green-600">
              Your session is ready!
            </div>
          )}
        </div>

        <DialogFooter>
          {ready && <Button onClick={onClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

