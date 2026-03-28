import { NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;

export async function POST(request: Request) {
  if (!GRAPHQL_ENDPOINT) {
    return NextResponse.json(
      {
        errors: [
          {
            message: "GRAPHQL_ENDPOINT nao configurado."
          }
        ]
      },
      { status: 500 }
    );
  }

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
