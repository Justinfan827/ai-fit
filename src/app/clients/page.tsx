import {redirectClientHomePage} from "@/lib/supabase/server/auth-utils";

export default async function ClientPage() {
  await redirectClientHomePage()
}
