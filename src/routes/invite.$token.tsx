import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);

  const inviteQ = useQuery({
    queryKey: ["invite", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_collaborator_invite", { _token: token });
      if (error) throw error;
      const row = (data ?? [])[0];
      if (!row) return null;
      return {
        id: row.id as string,
        event_id: row.event_id as string,
        invited_email: row.invited_email as string,
        status: row.status as string,
        events: { name: row.event_name as string, slug: row.event_slug as string },
      };
    },
  });

  const accept = async () => {
    if (!session || !inviteQ.data) return;
    if (session.user.email?.toLowerCase() !== inviteQ.data.invited_email.toLowerCase()) {
      toast.error(`This invite is for ${inviteQ.data.invited_email}. Sign in with that email.`);
      return;
    }
    setAccepting(true);
    const { data, error } = await supabase.rpc("accept_collaborator_invite", { _token: token });
    setAccepting(false);
    if (error) return toast.error(error.message);
    toast.success("You're now a collaborator");
    navigate({ to: "/events/$id", params: { id: (data as string) ?? inviteQ.data.event_id } });
  };

  if (inviteQ.isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!inviteQ.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl">Invite not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This link is invalid or has been revoked.</p>
          <Link to="/" className="mt-6 inline-block text-sm underline">Go home</Link>
        </div>
      </div>
    );
  }

  const invite = inviteQ.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Collaboration invite</p>
        <h1 className="mt-3 font-display text-3xl">{invite.events?.name ?? "This event"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You've been invited as an editor to co-manage this event.
        </p>
        <p className="mt-2 text-sm">
          For: <span className="font-medium">{invite.invited_email}</span>
        </p>

        {invite.status === "accepted" ? (
          <>
            <p className="mt-6 text-sm text-emerald-700">Already accepted.</p>
            <Link to="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Go to dashboard</Button>
            </Link>
          </>
        ) : loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : session ? (
          <Button className="mt-6 w-full" onClick={accept} disabled={accepting}>
            {accepting ? "Accepting…" : "Accept invite"}
          </Button>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              Sign in with {invite.invited_email} to accept.
            </p>
            <Link to="/auth" search={{ redirect: `/invite/${token}` }} className="mt-4 inline-block w-full">
              <Button className="w-full">Sign in</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
