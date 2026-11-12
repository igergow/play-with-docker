'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/contexts/SessionContext';
import { api } from '@/lib/api';
import type { Template } from '@/lib/types';

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
}

export function TemplatesModal({ open, onClose }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { session, setSession } = useSession();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    // Templates would typically come from an API endpoint
    // For now, we'll use an empty array or mock data
    setTemplates([]);
  };

  const handleSetupSession = async (setup: string) => {
    if (!session?.id) return;

    setLoading(true);
    setError('');

    try {
      await api.setupSession(session.id, { stack: setup });
      onClose();
    } catch (err) {
      console.error('Failed to setup session:', err);
      setError('Failed to setup session with template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Templates</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 font-bold py-4">{error}</div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {templates.length === 0 ? (
              <div className="col-span-2 text-center text-gray-500 py-8">
                No templates available
              </div>
            ) : (
              templates.map((template, idx) => (
                <Card
                  key={idx}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSetupSession(template.setup)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {template.icon && (
                        <img
                          src={template.icon}
                          alt={template.title}
                          className="w-16 h-16 object-contain"
                        />
                      )}
                      <CardTitle>{template.title}</CardTitle>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

