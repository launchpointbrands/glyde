import { NextResponse } from "next/server";
import { renderReport, type ReportType } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/server";

const TYPES: ReportType[] = ["valuation", "risk", "wealth", "succession"];

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ caseId: string; type: string }> },
) {
  const { caseId, type } = await ctx.params;

  if (!TYPES.includes(type as ReportType)) {
    return new NextResponse("Unknown report type.", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Sign in to download reports.", { status: 401 });
  }

  // RLS ensures the case lookup inside renderReport returns null if the
  // advisor doesn't own the case. We surface that as 404 below.
  try {
    const { buffer, filename } = await renderReport(
      caseId,
      type as ReportType,
    );
    // Convert Node Buffer to Uint8Array because NextResponse / fetch
    // body types in Next 16 prefer it.
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not generate PDF.";
    console.error("renderReport failed", e);
    return new NextResponse(msg, { status: 500 });
  }
}
