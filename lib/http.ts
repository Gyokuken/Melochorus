import { NextResponse } from "next/server";

/** Error that carries an HTTP status, so route handlers can map it to a response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Map a thrown error to a JSON response: HttpError -> its status, else 500. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
