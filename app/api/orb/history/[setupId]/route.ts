import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: { setupId: string } }) {
  try {
    const supabase = await createServiceClient();

    const { data: trades, error: tradesError } = await supabase
      .from("orb_tracker")
      .select("*")
      .eq("setup_id", params.setupId)
      .order("entry_date", { ascending: false });

    if (tradesError) {
      return NextResponse.json({ error: tradesError.message }, { status: 500 });
    }

    const { data: signals, error: signalsError } = await supabase
      .from("orb_signal_log")
      .select("*")
      .eq("setup_id", params.setupId)
      .order("event_date", { ascending: false })
      .limit(50);

    if (signalsError) {
      return NextResponse.json({ error: signalsError.message }, { status: 500 });
    }

    const { data: backtestInstances, error: backtestError } = await supabase
      .from("orb_backtest_instances")
      .select("*")
      .eq("setup_id", params.setupId)
      .order("signal_date", { ascending: false })
      .limit(20);

    if (backtestError) {
      return NextResponse.json({ error: backtestError.message }, { status: 500 });
    }

    return NextResponse.json({ trades: trades || [], signals: signals || [], backtest: backtestInstances || [] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
