import { notionService } from "../../../../backend/services/notion.service";
import { apiResult } from "../../_lib/api-response";

export async function POST(request: Request) {
  const body = await request.json();

  return apiResult(() =>
    notionService.listDatabases({
      notionToken: String(body?.settings?.notionToken ?? ""),
    }),
  );
}
