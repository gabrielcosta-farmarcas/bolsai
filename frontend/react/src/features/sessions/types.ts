export type SessionStatus = 'draft' | 'analysed' | 'reviewed';

export type Session = {
  id: string;
  directReportId: string;
  heldOn: string;
  status: SessionStatus;
  summaryExportedAt: string | null;
  createdAt: string;
};

export type SessionDetail = Session & { transcript: string };

export type NewSessionInput =
  | { kind: 'text'; heldOn: string; transcript: string }
  | { kind: 'file'; heldOn: string; file: File };

export type SessionSummary = { markdown: string; fileName: string; exportedAt: string };
