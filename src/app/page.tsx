import { redirect } from "next/navigation";

/** Portal-Start – immer ins Dashboard (Spec 3.2). */
export default function Home() {
  redirect("/dashboard");
}
