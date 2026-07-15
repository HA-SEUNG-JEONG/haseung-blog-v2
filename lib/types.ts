export type Post = {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  is_draft: boolean;
  published_at: string | null;
  comments_enabled: boolean;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
};
