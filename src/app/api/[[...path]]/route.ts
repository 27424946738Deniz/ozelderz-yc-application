import { NextRequest } from "next/server";
import { handleApiRequest } from "@/lib/api-router";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function dispatch(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  return handleApiRequest(request, request.method, path);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return dispatch(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return dispatch(request, context);
}
