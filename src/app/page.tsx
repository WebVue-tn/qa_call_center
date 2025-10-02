import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center">Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Your application is ready
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
