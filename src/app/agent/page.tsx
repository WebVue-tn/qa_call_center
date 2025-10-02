import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export default async function AgentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAgent) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Agent Dashboard</CardTitle>
          <CardDescription>
            Welcome, {session.user.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-6 text-center">
            <h2 className="text-2xl font-semibold text-blue-900">
              Coming Soon
            </h2>
            <p className="mt-2 text-blue-700">
              The agent dashboard is currently under development.
            </p>
            <div className="mt-6 text-left">
              <h3 className="font-semibold text-blue-900">
                Planned Features:
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-blue-700">
                <li>Calendar view of assigned reservations</li>
                <li>Daily schedule and route optimization</li>
                <li>Customer details for appointments</li>
                <li>Check-in/check-out functionality</li>
                <li>Performance analytics</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">
              Your Account Information
            </h3>
            <dl className="mt-4 space-y-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Name</dt>
                <dd className="text-sm text-slate-900">{session.user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="text-sm text-slate-900">{session.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Roles</dt>
                <dd className="text-sm text-slate-900">
                  {[
                    session.user.isAdmin && "Admin",
                    session.user.isAgent && "Agent",
                    session.user.isTelephoniste && "Telephoniste",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
