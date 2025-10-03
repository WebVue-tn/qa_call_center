import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { isTelephoniste, isAdmin, isAgent } = session.user;

  // If user is ONLY a telephoniste, redirect directly to telephoniste view
  if (isTelephoniste && !isAdmin && !isAgent) {
    redirect("/telephoniste");
  }

  // Otherwise, show role selection page
  const availableRoles = [];
  if (isAdmin) availableRoles.push({ name: "Admin", href: "/admin/contacts" });
  if (isAgent) availableRoles.push({ name: "Agent", href: "/agent" });
  if (isTelephoniste) availableRoles.push({ name: "Telephoniste", href: "/telephoniste" });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center">Welcome, {session.user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Select a view to continue
          </p>
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <Link key={role.name} href={role.href} className="block">
                <Button className="w-full" size="lg">
                  {role.name} Dashboard
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
