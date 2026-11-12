'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TerminalService } from '@/lib/terminal';
import { useWebSocket } from '@/lib/contexts/WebSocketContext';
import { useSession } from '@/lib/contexts/SessionContext';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  instanceName: string;
}

export function Terminal({ instanceName }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalServiceRef = useRef<TerminalService | null>(null);
  const { ws } = useWebSocket();
  const { session } = useSession();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [reconnecting, setReconnecting] = useState(false);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminalServiceRef.current) return;

    const terminal = new TerminalService({
      fontSize: parseInt(localStorage.getItem('terminalFontSize') || '14'),
    });

    terminalServiceRef.current = terminal;
    terminal.open(terminalRef.current);

    // Handle terminal input
    terminal.onData((data) => {
      if (session?.id) {
        ws.sendTerminalInput(instanceName, data);
      }
    });

    // Handle terminal resize
    terminal.onResize((geometry) => {
      if (session?.id) {
        ws.resizeTerminal(geometry.cols, geometry.rows);
      }
    });

    // Fit terminal on mount
    setTimeout(() => {
      terminal.fit();
    }, 100);

    return () => {
      terminal.dispose();
      terminalServiceRef.current = null;
    };
  }, [instanceName, session?.id, ws]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!terminalServiceRef.current || !ws) return;

    const handleTerminalOut = (instance: string, data: string) => {
      if (instance === instanceName && terminalServiceRef.current) {
        terminalServiceRef.current.write(data);
      }
    };

    const handleReconnect = () => {
      setReconnecting(true);
    };

    const handleConnected = () => {
      setReconnecting(false);
    };

    ws.on('instance terminal out', handleTerminalOut);
    ws.on('disconnected', handleReconnect);
    ws.on('connected', handleConnected);

    return () => {
      ws.off('instance terminal out', handleTerminalOut);
      ws.off('disconnected', handleReconnect);
      ws.off('connected', handleConnected);
    };
  }, [instanceName, ws]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (terminalServiceRef.current) {
        setTimeout(() => {
          terminalServiceRef.current?.fit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // File upload with drag and drop
  const onDrop = async (acceptedFiles: File[]) => {
    if (!session?.id || acceptedFiles.length === 0) return;

    const totalFiles = acceptedFiles.length;
    let uploaded = 0;

    for (const file of acceptedFiles) {
      try {
        setUploadMessage(`Uploading ${uploaded + 1}/${totalFiles}: ${file.name}`);
        setUploadProgress(0);

        // Note: The actual upload progress would need to be tracked via XMLHttpRequest
        // For now, we'll use a simple approach
        await api.uploadFile(session.id, instanceName, file);
        
        uploaded++;
        setUploadProgress((uploaded / totalFiles) * 100);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadMessage(`Failed to upload ${file.name}`);
      }
    }

    setTimeout(() => {
      setUploadMessage('');
      setUploadProgress(0);
    }, 2000);
  };

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative h-full ${isDragActive ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''}`}
    >
      {/* Upload Progress */}
      {uploadMessage && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white p-2 shadow">
          <Progress value={uploadProgress} className="mb-2" />
          <div className="text-sm text-gray-600">{uploadMessage}</div>
        </div>
      )}

      {/* Reconnecting Message */}
      {reconnecting && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-100 p-2 text-center text-sm text-yellow-800">
          Connection has been lost. Trying to reconnect terminal...
        </div>
      )}

      {/* Terminal Container */}
      <div
        ref={terminalRef}
        className="h-full w-full"
        style={{ padding: '8px' }}
      />
    </div>
  );
}

