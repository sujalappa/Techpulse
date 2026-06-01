export type Item = {
  id: string;
  title: string;
  url: string;
  source: string;
  author?: string | null;
  summary: string;
  category?: string | null;
  stack_tags: string[];
  relevance_score: number;
  novelty_score: number;
};

export type Digest = {
  id: string;
  run_id: string;
  title: string;
  intro: string;
  markdown: string;
  html: string;
  items: Item[];
  created_at: string;
  published_targets: string[];
};

export type Checkpoint = {
  id: string;
  run_id: string;
  name: "topic_filter" | "ranked_items" | "final_digest";
  title: string;
  description: string;
  payload: {
    items: Item[];
    digest: Digest | null;
  };
  approved: boolean;
};

export type RunState = {
  id: string;
  status: "running" | "waiting_approval" | "completed" | "failed";
  stage: string;
  items: Item[];
  digest?: Digest | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscriber = {
  id: string;
  email: string;
  name?: string | null;
  topics: string[];
  frequency: "weekly";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
