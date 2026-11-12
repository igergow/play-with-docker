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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { keyboardShortcutPresets, terminalFontSizes } from '@/lib/terminal';
import { api } from '@/lib/api';
import type { KeyboardShortcutPreset } from '@/lib/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [shortcutPreset, setShortcutPreset] = useState<KeyboardShortcutPreset | null>(null);
  const [instanceImage, setInstanceImage] = useState<string>('');
  const [fontSize, setFontSize] = useState<string>('14');
  const [availableImages, setAvailableImages] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadSettings();
      loadImages();
    }
  }, [open]);

  const loadSettings = () => {
    const savedShortcut = localStorage.getItem('keyboardShortcutPreset');
    const savedImage = localStorage.getItem('desiredInstanceImage') || '';
    const savedFontSize = localStorage.getItem('terminalFontSize') || '14';

    if (savedShortcut) {
      try {
        setShortcutPreset(JSON.parse(savedShortcut));
      } catch (e) {
        setShortcutPreset(keyboardShortcutPresets[0]);
      }
    } else {
      setShortcutPreset(keyboardShortcutPresets[0]);
    }

    setInstanceImage(savedImage);
    setFontSize(savedFontSize);
  };

  const loadImages = async () => {
    try {
      const images = await api.getInstanceImages();
      setAvailableImages(images);
    } catch (error) {
      console.error('Failed to load instance images:', error);
    }
  };

  const handleShortcutChange = (presetName: string) => {
    const preset = keyboardShortcutPresets.find((p) => p.name === presetName);
    if (preset) {
      setShortcutPreset(preset);
      localStorage.setItem('keyboardShortcutPreset', JSON.stringify(preset));
    }
  };

  const handleImageChange = (image: string) => {
    setInstanceImage(image);
    localStorage.setItem('desiredInstanceImage', image);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('terminalFontSize', size);
    // Trigger resize event for all terminals
    window.dispatchEvent(new Event('resize'));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Keyboard Shortcut Preset */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shortcut-preset">Keyboard Shortcut Preset</Label>
              <Select
                value={shortcutPreset?.name || ''}
                onValueChange={handleShortcutChange}
              >
                <SelectTrigger id="shortcut-preset" className="mt-1">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {keyboardShortcutPresets.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              {shortcutPreset && (
                <div>
                  <Label>Preset Details:</Label>
                  <ul className="mt-2 space-y-1 text-sm">
                    {shortcutPreset.presets.length === 0 ? (
                      <li className="text-gray-500">No presets defined</li>
                    ) : (
                      shortcutPreset.presets.map((preset, idx) => (
                        <li key={idx} className="text-gray-700">
                          <code className="bg-gray-100 px-1 rounded">{preset.command}</code> -{' '}
                          {preset.description}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Instance Image */}
          <div>
            <Label htmlFor="instance-image">Instance Image</Label>
            <Select value={instanceImage} onValueChange={handleImageChange}>
              <SelectTrigger id="instance-image" className="mt-1">
                <SelectValue placeholder="Select instance image" />
              </SelectTrigger>
              <SelectContent>
                {availableImages.map((image) => (
                  <SelectItem key={image} value={image}>
                    {image}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Terminal Font Size */}
          <div>
            <Label htmlFor="font-size">Terminal Font Size</Label>
            <Select value={fontSize} onValueChange={handleFontSizeChange}>
              <SelectTrigger id="font-size" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {terminalFontSizes.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

