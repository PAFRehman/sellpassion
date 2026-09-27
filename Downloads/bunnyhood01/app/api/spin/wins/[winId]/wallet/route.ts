import { after } from "next/server";
import { requireSessionUser } from "@/lib/spin/auth";
import { assertSameOrigin, json, readJson, routeError } from "@/lib/spin/http";
import { flushSheetOutbox } from "@/lib/spin/sheets";
import { submitWinWallet } from "@/lib/spin/wheel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ winId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser(request, true);
    const { winId } = await context.params;
    const body = await readJson<{ wallet?: string }>(request);
    const result = await submitWinWallet(user, winId, body.wallet ?? "");
    after(() => flushSheetOutbox());
    return json(result);
  } catch (error) {
    return routeError(error);
  }
}

