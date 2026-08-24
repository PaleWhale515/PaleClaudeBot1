"""Renders a DailyDeskReport as plain text for the terminal."""

from __future__ import annotations

from stockdesk.models import DailyDeskReport


def render_text(report: DailyDeskReport) -> str:
    lines = []
    lines.append(f"=== Desk Report — {report.run_date.isoformat()} ===")
    lines.append(
        f"Scanned {report.universe_scanned} tickers | "
        f"{report.candidates_found} candidates found | "
        f"{report.candidates_qualified} qualified"
    )
    lines.append("")

    lines.append(f"Top setups (max {len(report.top_setups)}):")
    if not report.top_setups:
        lines.append("  (none cleared screening today)")
    for s in report.top_setups:
        lines.append(f"  [{s.composite_score:.2f}] {s.ticker} @ ${s.market.price}")
        if s.timing:
            lines.append(
                f"      entry {s.timing['entry_low']}-{s.timing['entry_high']} "
                f"| stop {s.timing['suggested_stop']} | {s.timing['trend']} | {s.timing['momentum']}"
            )
        if s.risk_flags:
            lines.append(f"      risk flags: {', '.join(s.risk_flags)}")
        for note in s.notes:
            lines.append(f"      - {note}")
    lines.append("")

    lines.append(f"Open position exit plans ({len(report.exit_plans)}):")
    if not report.exit_plans:
        lines.append("  (no open positions on file)")
    for p in report.exit_plans:
        lines.append(
            f"  {p.ticker}: entry ${p.entry_price} -> now ${p.current_price} "
            f"({p.unrealized_pct:+.1f}%) | stop {p.stop_price}"
        )
        for price, desc in p.scale_out_levels:
            lines.append(f"      {desc} @ {price}")
    lines.append("")

    lines.append("Needs human review:")
    if not report.needs_human_review:
        lines.append("  (nothing flagged)")
    for item in report.needs_human_review:
        lines.append(f"  * {item}")
    lines.append("")

    lines.append(report.disclaimer)
    return "\n".join(lines)
