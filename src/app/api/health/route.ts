import { NextResponse } from "next/server";
import { db } from "@/database/client";

/** Liveness + database connectivity probe for deploy platforms. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "down" }, { status: 503 });
  }
}
