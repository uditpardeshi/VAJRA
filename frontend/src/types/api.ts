// ==================== COMMON ====================
export interface ApiResponse<T> { data: T; meta?: Record<string, unknown> }
export interface PaginatedResponse<T> { items: T[]; total: number; page: number; pageSize: number }

// ==================== MACHINES ====================
export interface Machine {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  location?: string;
  manual_path?: string;
  specs_json?: string;
  created_at: string;
  updated_at: string;
  health_score?: number;
  last_inspection?: string;
  open_tickets?: number;
}

export interface MachineSpecs {
  spindle_speed_rpm?: number;
  max_tool_diameter_mm?: number;
  spindle_taper?: string;
  coolant_pressure_bar?: number;
  acceptable_spindle_runout_um?: number;
  oil_type?: string;
  bearing_replacement_interval_hours?: number;
  [key: string]: unknown;
}

// ==================== INSPECTION ====================
export interface DefectLocation {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface InspectRequest {
  machine_id: string;
  image_base64: string;
  prompt_override?: string;
}

export interface InspectResponse {
  inspection_id: number;
  machine_id: string;
  finding: string;
  confidence: number;
  defect_location?: DefectLocation;
  repair_steps: string[];
  needs_escalation: boolean;
  created_at: string;
}

export interface InspectionListItem extends InspectResponse {
  machine_name?: string;
  ticket_id?: number;
  escalation_status?: string;
}

// ==================== CHAT / RAG ====================
export interface Citation {
  machine_id: string;
  source_page: number;
  text_snippet: string;
  score: number;
}

export interface ChatRequest {
  question: string;
  machine_id?: string;
  top_k?: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: number;
  timestamp: string;
  isLoading?: boolean;
}

// ==================== ESCALATION ====================
export type EscalationStatus = 'pending' | 'acknowledged' | 'resolved';
export type EscalationReason = 'low_confidence' | 'safety_critical' | 'manual_review';

export interface Escalation {
  id: number;
  ticket_id: number;
  reason: EscalationReason;
  status: EscalationStatus;
  reviewer_id?: number;
  created_at: string;
  resolved_at?: string;
  ticket?: Ticket;
  machine?: Machine;
  inspection?: InspectionListItem;
}

export interface EscalationAction {
  id: number;
  escalation_id: number;
  action: 'acknowledged' | 'resolved' | 'reassigned';
  user_id: number;
  user_name: string;
  note?: string;
  created_at: string;
}

// ==================== TICKETS ====================
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 1 | 2 | 3 | 4;

export interface Ticket {
  id: number;
  inspection_id: number;
  machine_id: number;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to?: number;
  created_at: string;
  resolved_at?: string;
  machine?: Machine;
  inspection?: InspectionListItem;
}

// ==================== AGENT ====================
export type AgentRunStatus = 'running' | 'completed' | 'failed';

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration_ms: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface AgentRunResult {
  equipment?: string;
  measured_thickness_mm?: number;
  required_thickness_mm?: number;
  deviation_mm?: number;
  recommendation?: string;
  report_path?: string;
  findings?: string[];
  measurements?: Array<{ parameter: string; measured: number; required: number; unit: string }>;
  deviations?: Array<{ parameter: string; deviation: number; unit: string; status: string }>;
  recommendations?: string[];
  citations?: Citation[];
  confidence?: number;
}

export interface AgentRunResponse {
  run_id: number;
  status: AgentRunStatus;
  machine_id?: string;
  tools_used: string[];
  result: AgentRunResult;
  tool_trace: ToolCall[];
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface AgentRunListItem {
  id: number;
  user_id: number;
  machine_id?: number;
  input_file_path: string;
  status: AgentRunStatus;
  tools_used?: string;
  result_json?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// ==================== ANALYTICS ====================
export interface DashboardMetrics {
  total_inspections: number;
  open_tickets: number;
  pending_escalations: number;
  avg_confidence: number;
  mttr_hours: number;
  machines_online: number;
  inspections_today: number;
  escalations_today: number;
}

export interface TrendPoint { date: string; value: number; label?: string }
export interface MachineHealth { machine_id: string; health_score: number; last_inspection: string; open_issues: number }
export interface ConfidenceBucket { range: string; count: number; percentage: number }
export interface EscalationHeatmapCell { machine_id: string; date: string; count: number }

// ==================== WEBSOCKET ====================
export type WSMessageType = 'escalation_created' | 'escalation_acknowledged' | 'escalation_resolved' | 'inspection_completed' | 'agent_completed' | 'pong' | 'error';

export interface WSMessage<T = Record<string, unknown>> {
  type: WSMessageType;
  payload: T;
  timestamp: string;
}

export interface EscalationWSPayload {
  escalation_id: number;
  ticket_id: number;
  machine_id: string;
  reason: EscalationReason;
  confidence: number;
  finding: string;
  priority: number;
}
