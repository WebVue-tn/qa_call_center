import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import TelephonisteInterface from "./components/telephoniste-interface";

export default async function TelephonistePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isTelephoniste) {
    redirect("/");
  }

  return <TelephonisteInterface />;
}
