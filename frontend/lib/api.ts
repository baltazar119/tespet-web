const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tespet_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API hatası");
  }
  return res.json();
}

export async function register(data: {
  full_name: string; email: string; phone?: string; password: string;
}) {
  return request<{ access_token: string; role: string; full_name: string }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ ...data, role: "customer" }) }
  );
}

export async function forgotPassword(email: string) {
  return request<{ message: string }>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) }
  );
}

export async function login(email: string, password: string) {
  return request<{ access_token: string; role: string; full_name: string; company_name?: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function getMe() {
  return request<{ id: number; email: string; full_name: string; role: string; company_name?: string }>("/auth/me");
}

export async function getPolicies() {
  return request<Policy[]>("/policies/");
}

export async function getPolicy(id: number) {
  return request<Policy>(`/policies/${id}`);
}

export async function getClaims(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<Claim[]>(`/claims/${qs}`);
}

export async function getClaim(id: number) {
  return request<Claim>(`/claims/${id}`);
}

export async function createClaim(formData: FormData) {
  const token = getToken();
  const res = await fetch(`${BASE}/claims/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Hasar kaydı oluşturulamadı");
  }
  return res.json() as Promise<Claim>;
}

export async function approveClaim(id: number, approved_amount: number, insurer_notes?: string) {
  return request<Claim>(`/claims/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ approved_amount, insurer_notes }),
  });
}

export async function rejectClaim(id: number, insurer_notes: string) {
  return request<Claim>(`/claims/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ insurer_notes }),
  });
}

export async function downloadClaimReport(id: number): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tespet_token") : null;
  const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${BASE}/claims/${id}/report.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errBody.detail || "PDF oluşturulamadı");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tespet-ekspertiz-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getSatelliteImageUrl(claimId: number): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${base}/claims/${claimId}/satellite.jpg`;
}

export async function getDisasters(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return request<Disaster[]>(`/disasters/${qs}`);
}

export async function getDisaster(id: number) {
  return request<Disaster>(`/disasters/${id}`);
}

export async function getAffectedPolicies(disasterId: number) {
  return request<AffectedPolicy[]>(`/disasters/${disasterId}/affected-policies`);
}

export async function analyzeDisasterSatellite(disasterId: number) {
  return request<DisasterAnalysis>(`/disasters/${disasterId}/analyze`, { method: "POST" });
}

export async function getAnalytics() {
  return request<Analytics>("/analytics/summary");
}

export async function updateProfile(data: {
  full_name?: string;
  email?: string;
  company_name?: string;
  phone?: string;
  password?: string;
}) {
  return request<{ id: number; email: string; full_name: string; role: string; company_name?: string }>(
    "/auth/profile",
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

// ── TYPES ──────────────────────────────────────────────────────────────────

export interface Policy {
  id: number;
  policy_number: string;
  policy_type: string;
  status: string;
  property_address: string;
  property_city: string;
  property_district: string;
  property_lat: number;
  property_lon: number;
  property_area_m2: number;
  coverage_amount: number;
  premium_amount: number;
  start_date: string;
  end_date: string;
  customer_id: number;
  insurer_id: number;
}

export interface Claim {
  id: number;
  claim_number: string;
  policy_id: number;
  customer_id: number;
  disaster_id?: number;
  disaster_type: string;
  description: string;
  incident_lat: number;
  incident_lon: number;
  image_path?: string;
  damage_score?: number;
  damage_category?: string;
  affected_area_m2?: number;
  ai_confidence?: number;
  estimated_min_cost?: number;
  estimated_max_cost?: number;
  field_inspection_required?: boolean;
  priority_level?: string;
  ai_notes?: string;
  expert_report?: string;
  satellite_image_path?: string;
  vlm_score?: number;
  satellite_score?: number;
  satellite_category?: string;
  satellite_confidence?: number;
  satellite_class?: string;
  status: string;
  approved_amount?: number;
  insurer_notes?: string;
  payment_simulated: boolean;
  created_at?: string;
}

export interface Disaster {
  id: number;
  name: string;
  disaster_type: string;
  status: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  city: string;
  district?: string;
  magnitude?: number;
  severity_score: number;
  satellite_damage_score?: number;
  affected_buildings_estimate?: number;
  description?: string;
  source?: string;
  occurred_at: string;
  affected_policy_count?: number;
}

export interface AffectedPolicy {
  policy_id: number;
  policy_number: string;
  property_address: string;
  property_city: string;
  coverage_amount: number;
  policy_type: string;
  distance_km: number;
  priority_score: number;
  lat?: number;
  lon?: number;
}

export interface DisasterPolicyResult {
  policy_id: number;
  policy_number: string;
  property_address: string;
  property_city: string;
  coverage_amount: number;
  policy_type: string;
  distance_km: number;
  priority_score: number;
  satellite_class: string;
  satellite_score: number;
  combined_score: number;
  estimated_loss: number;
  image_source: string;
  lat: number;
  lon: number;
  auto_created?: boolean;
  claim_number?: string;
}

export interface DisasterAnalysisSummary {
  total_policies: number;
  total_risk_tl: number;
  auto_claims: number;
  destroyed: number;
  major_damage: number;
  avg_score: number;
}

export interface DisasterAnalysis {
  disaster_id: number;
  results: DisasterPolicyResult[];
  summary: DisasterAnalysisSummary;
}

export interface Analytics {
  total_claims: number;
  approved: number;
  rejected: number;
  pending: number;
  reviewed: number;
  total_approved_amount: number;
  avg_damage_score: number;
  avg_processing_minutes: number;
  industry_avg_days: number;
  field_savings_tl: number;
  no_field_needed: number;
  ai_auto_rate: number;
  damage_categories: Record<string, number>;
  disaster_types: Record<string, number>;
  weekly_claims: { day: string; count: number }[];
  total_policies: number;
}
