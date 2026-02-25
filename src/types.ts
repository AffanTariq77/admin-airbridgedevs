export type Repo = {
  id: string;
  name: string;
  description?: string;
  submissionCount?: number;
};

export type Submission = {
  id: number;
  name: string;
  email: string;
  company?: string;
  message: string;
  timestamp: string;
  llmProvider?: string | null;
  monthlySpend?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  status?: string | null;
  notes?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
  affiliateId?: number | null;
  affiliateName?: string | null;
  channel?: string | null;
};

export type Affiliate = {
  id: number;
  name: string;
  code?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type AttributionSummary = {
  total: number;
  bySource: { key: string; count: number }[];
  byMedium: { key: string; count: number }[];
  byChannel: { key: string; count: number }[];
  byAffiliate: { key: string; count: number }[];
  topReferrers: { key: string; count: number }[];
};
