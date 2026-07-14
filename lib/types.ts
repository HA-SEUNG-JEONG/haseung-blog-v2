export type Post = {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  is_draft: boolean;
  published_at: string | null;
  comments_enabled: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};
