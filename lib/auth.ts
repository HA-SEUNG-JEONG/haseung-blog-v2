import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Deduped per request so the navbar, the page and generateMetadata share one call.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
