// Type definitions matching Go backend structures

export interface User {
  id: string;
  provider: string;
  provider_user_id: string;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
}

export interface Playground {
  id: string;
  domain: string;
  default_dind_instance_image: string;
  available_dind_instance_images: string[];
  allow_windows_instances: boolean;
  default_session_duration: number;
  dind_volume_size: string;
}

export interface Session {
  id: string;
  playground_id: string;
  created_at: string;
  expires_at: string;
  ready: boolean;
  stack: string;
  stack_name: string;
}

export interface Instance {
  name: string;
  hostname: string;
  ip: string;
  image: string;
  proxy_host: string;
  session_id: string;
  type: string;
  ports: number[];
  swarm_ports: number[];
  is_manager: boolean;
  is_k8s_manager: boolean;
  mem: string;
  cpu: string;
  status?: string;
}

export interface InstanceStats {
  name: string;
  cpu: string;
  mem: string;
  is_manager?: boolean;
  is_k8s_manager?: boolean;
}

export interface Template {
  title: string;
  icon: string;
  setup: string;
}

export interface KeyboardShortcutPreset {
  name: string;
  presets: Array<{
    command: string;
    description: string;
  }>;
}

export interface FileTreeNode {
  path: string;
  name: string;
  is_dir: boolean;
  children?: FileTreeNode[];
}

export interface SessionSetupRequest {
  image_name?: string;
  type?: string;
  stack?: string;
  stack_name?: string;
}

export interface NewInstanceRequest {
  image_name?: string;
  type?: string;
}

