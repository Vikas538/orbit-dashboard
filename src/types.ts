export interface Session {
  session_id: string
  ticket_id: string
  status: string
  ws_url: string | null
  model_used: string | null
  repo_name: string | null
  started_at: string | null
  time_remaining: number  // seconds
}

export interface SessionDetail extends Session {
  ticket_details: Record<string, unknown> | null
  plan: string | null
  reasoning: string | null
  file_changes: string[]
  function_changes: string[]
  task_arn: string | null
  permission_log: PermissionEntry[]
}

export interface PermissionEntry {
  permission_id: string
  action: string
  command: string
  reason: string
  status: 'PENDING' | 'GRANTED' | 'DENIED' | 'TIMEOUT'
  resolved_by: string | null
  requested_at: string | null
  resolved_at: string | null
}

// WebSocket message shapes
export interface ChatMessage {
  type: 'agent' | 'system' | 'user_message'
  content: string
  timestamp: string
}

export interface PlanMessage {
  type: 'system' | 'plan' | 'heartbeat'
  content: string
  timestamp: string
}

export interface DiffMessage {
  type: 'diff'
  file: string
  patch: string
  timestamp: string
}

export interface PermissionRequestMessage {
  type: 'permission_request'
  id: string
  action: string
  command: string
  reason: string
  session_id: string
  timestamp: string
}

export interface PermissionResolvedMessage {
  type: 'permission_resolved'
  permission_id: string
  granted: boolean
}

export type PermsMessage = PermissionRequestMessage | PermissionResolvedMessage
