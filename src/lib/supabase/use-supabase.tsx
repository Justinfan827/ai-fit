"use client";

import { SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "./create-browser-client";
import { Database } from "./database.types";

type MaybeUser = User | null;

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  user: MaybeUser;
};
const Context = createContext<SupabaseContext | undefined>(undefined);

/**
 * SupabaseProvider is how we expose the supabase client in client components
 **/
export default function SupabaseProvider({
  children,
  user: initialUser,
}: {
  children: React.ReactNode;

  user: MaybeUser;
}) {
  const router = useRouter();
  const [user, setUser] = useState<MaybeUser>(initialUser);
  const [supabase] = useState(() => createBrowserClient());
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // refresh server component data
      setUser(session?.user ?? null);
      if (!!session?.user) {
        Sentry.setUser({ id: session.user.id, email: session.user.email });
      }
      router.refresh();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);
  return (
    <Context.Provider value={{ supabase, user }}>
      <>{children}</>
    </Context.Provider>
  );
}
export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
