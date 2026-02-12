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
  status?: string | null;
  notes?: string | null;
};
