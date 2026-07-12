import { redirect } from "next/navigation";

export default function SearchRedirectPage() {
  redirect("/dashboard/opportunities");
}
