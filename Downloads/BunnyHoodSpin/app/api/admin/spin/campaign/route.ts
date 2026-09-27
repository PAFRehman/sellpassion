import { requireSpinAdmin } from "@/lib/spin/admin";
import { publishCampaign } from "@/lib/spin/campaigns";
import { assertSameOrigin, json, readJson, routeError } from "@/lib/spin/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    requireSpinAdmin(request);
    const body = await readJson<{
      title?: string;
      tweetUrl?: string;
      redeemCode?: string;
      endsAt?: string;
    }>(request);
    const campaign = await publishCampaign({
      title: body.title ?? "",
      tweetUrl: body.tweetUrl ?? "",
      redeemCode: body.redeemCode ?? "",
      endsAt: body.endsAt,
    });
    return json({ campaign }, 201);
  } catch (error) {
    return routeError(error);
  }
}

