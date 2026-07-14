"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// The middleware no longer guards routes (authoring lives on public /posts/* now),
// so every mutating action checks the session itself. RLS is still the last word.
async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password")),
  });
  if (error) redirect(`/admin/login?error=1&email=${encodeURIComponent(email)}`);
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ponytail: no draft index anywhere — a draft is only reachable at its own /posts/<slug>.
// Add a list back (home page, admin-only rows) if drafts ever start getting lost.
export async function createPost() {
  const supabase = await authedClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ slug: `draft-${crypto.randomUUID().slice(0, 8)}` })
    .select("slug")
    .single();
  if (error || !data) throw new Error(error?.message ?? "insert failed");
  redirect(`/posts/${data.slug}?edit=1`);
}

const UPDATABLE = [
  "title",
  "slug",
  "content_md",
  "is_draft",
  "published_at",
  "comments_enabled",
] as const;

// Returns an error or null. `field` lets the editor render the message next to the input it belongs
// to. Allowlist keeps view_count/created_at untouchable.
export type UpdateError = { field: "slug" | null; message: string };

export async function updatePost(
  id: string,
  patch: Partial<Record<(typeof UPDATABLE)[number], unknown>>
): Promise<UpdateError | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of UPDATABLE) if (key in patch) update[key] = patch[key];

  if ("slug" in update) {
    const slug = String(update.slug ?? "").trim();
    if (!slug) return { field: "slug", message: "slug을 입력해 주세요." };
    if (slug.includes("/")) return { field: "slug", message: "slug에 '/'는 쓸 수 없습니다." };
    update.slug = slug;
  }

  const supabase = await authedClient();
  const { error } = await supabase.from("posts").update(update).eq("id", id);
  if (!error) {
    revalidatePath("/", "layout");
    return null;
  }
  return error.code === "23505"
    ? { field: "slug", message: "이미 사용 중인 slug입니다." }
    : { field: null, message: error.message };
}

export async function publishPost(id: string) {
  const supabase = await authedClient();
  const { data } = await supabase.from("posts").select("published_at").eq("id", id).single();
  const { error } = await supabase
    .from("posts")
    .update({
      is_draft: false,
      published_at: data?.published_at ?? new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function unpublishPost(id: string) {
  const supabase = await authedClient();
  const { error } = await supabase.from("posts").update({ is_draft: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ponytail: storage attachments are not cleaned up on delete; add a cleanup pass if orphans ever matter
export async function deletePost(id: string) {
  const supabase = await authedClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/"); // the post page this was called from is gone
}
