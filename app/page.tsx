import { getMediaFiles } from "@/lib/media";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const files = await getMediaFiles();
  return <Dashboard files={files} />;
}
