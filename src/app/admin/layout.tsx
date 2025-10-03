import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Home, Users, UserCircle } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="font-semibold">Vibe Kanban</span>
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin/contacts">
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Contacts
                </Button>
              </Link>
              <Link href="/admin/telephoniste-management">
                <Button variant="ghost" size="sm">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Telephoniste Management
                </Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {session.user.isTelephoniste && (
              <Link href="/telephoniste">
                <Button variant="outline" size="sm">
                  Telephoniste View
                </Button>
              </Link>
            )}
            {session.user.isAgent && (
              <Link href="/agent">
                <Button variant="outline" size="sm">
                  Agent View
                </Button>
              </Link>
            )}
            <div className="text-sm text-muted-foreground">
              {session.user.name}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
