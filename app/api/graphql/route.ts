import { NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = "https://mundo-da-lua-crm-core.onrender.com/graphql/";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const body = await request.text();

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {})
    },
    body
  });

  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
