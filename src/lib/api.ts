import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/authorization";

export function apiError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Please check the form fields.", issues: error.flatten() },
      { status: 400 },
    );
  }

  console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    throw new AuthorizationError("Invalid request origin.", 403);
  }
}
