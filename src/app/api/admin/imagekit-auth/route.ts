import { getAdmin } from "@/lib/auth/dal";
import { getUploadAuth } from "@/lib/imagekit";

export async function GET() {
  if (!(await getAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(getUploadAuth(), { headers: { "Cache-Control": "no-store" } });
}
