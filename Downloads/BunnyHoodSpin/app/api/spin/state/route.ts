import { getSessionUser } from "@/lib/spin/auth";
import { json, routeError } from "@/lib/spin/http";
import { getWheelState } from "@/lib/spin/wheel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    return json(await getWheelState(user));
  } catch (error) {
    return routeError(error);
  }
}

