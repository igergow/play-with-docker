'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import type { FileTreeNode } from '@/lib/types';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface EditorTab {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

export function EditorPageClient({
  sessionId,
  instanceName,
}: {
  sessionId: string;
  instanceName: string;
}) {
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFileTree();
  }, [sessionId, instanceName]);

  const loadFileTree = async () => {
    try {
      setLoading(true);
      setError('');
      const tree = await api.getFileTree(sessionId, instanceName);
      setFileTree(tree);
    } catch (err) {
      console.error('Failed to load file tree:', err);
      setError('Failed to load file tree');
    } finally {
      setLoading(false);
    }
  };

  const openFile = async (path: string) => {
    // Check if file is already open
    const existingTab = tabs.find((tab) => tab.path === path);
    if (existingTab) {
      setActiveTab(path);
      return;
    }

    try {
      setLoading(true);
      const content = await api.getFile(sessionId, instanceName, path);
      const name = path.split('/').pop() || path;
      const newTab: EditorTab = {
        path,
        name,
        content,
        isDirty: false,
      };
      setTabs([...tabs, newTab]);
      setActiveTab(path);
    } catch (err) {
      console.error('Failed to open file:', err);
      setError('Failed to open file');
    } finally {
      setLoading(false);
    }
  };

  const closeTab = (path: string) => {
    const newTabs = tabs.filter((tab) => tab.path !== path);
    setTabs(newTabs);
    if (activeTab === path) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
    }
  };

  const updateTabContent = (path: string, content: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.path === path ? { ...tab, content, isDirty: true } : tab
      )
    );
  };

  const saveFile = async (path: string) => {
    const tab = tabs.find((t) => t.path === path);
    if (!tab) return;

    try {
      setLoading(true);
      // Note: The API might need a PUT/POST endpoint for saving files
      // For now, we'll just mark it as saved
      setTabs((prevTabs) =>
        prevTabs.map((t) => (t.path === path ? { ...t, isDirty: false } : t))
      );
    } catch (err) {
      console.error('Failed to save file:', err);
      setError('Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const renderFileTree = (node: FileTreeNode, level = 0) => {
    const indent = level * 20;
    const isDir = node.is_dir;

    return (
      <div key={node.path} className="select-none">
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer"
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => !isDir && openFile(node.path)}
        >
          <span className="mr-2">
            {isDir ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
              </svg>
            )}
          </span>
          <span className="text-sm">{node.name}</span>
        </div>
        {isDir && node.children && (
          <div>{node.children.map((child) => renderFileTree(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      go: 'go',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      md: 'markdown',
      sh: 'shell',
      bash: 'shell',
      dockerfile: 'dockerfile',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">File Editor</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadFileTree}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-64 bg-white border-r overflow-y-auto p-4">
          <div className="mb-4 text-sm text-gray-600">
            <strong>Create or upload</strong> files in the session terminal and then refresh
          </div>
          {loading && <div className="text-sm text-gray-500">Loading...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {fileTree && (
            <div className="space-y-1">{renderFileTree(fileTree)}</div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tabs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a file from the tree to edit
            </div>
          ) : (
            <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start border-b rounded-none">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.path}
                    value={tab.path}
                    className="relative"
                  >
                    {tab.name}
                    {tab.isDirty && (
                      <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                    <button
                      className="ml-2 hover:bg-gray-200 rounded px-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.path);
                      }}
                    >
                      ×
                    </button>
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.path}
                  value={tab.path}
                  className="flex-1 m-0 overflow-hidden"
                >
                  <div className="h-full flex flex-col">
                    <div className="bg-white border-b px-4 py-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => saveFile(tab.path)}
                        disabled={!tab.isDirty}
                      >
                        Save
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <MonacoEditor
                        height="100%"
                        language={getLanguageFromPath(tab.path)}
                        value={tab.content}
                        onChange={(value) => updateTabContent(tab.path, value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: 'on',
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

