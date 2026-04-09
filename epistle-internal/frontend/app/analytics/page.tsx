'use client';

import { useEffect, useState } from 'react';
import {
  fetchAnalyticsOverview,
  type AnalyticsDailySummaryRow,
  type AnalyticsDay1RetentionRow,
  type AnalyticsOverviewResponse,
} from '@/lib/api';

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function DailyTable({ rows }: { rows: AnalyticsDailySummaryRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">Daily Summary</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Daily active devices and completed onboardings.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-zinc-400">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-left font-medium">DAU</th>
              <th className="px-5 py-3 text-left font-medium">Onboardings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.event_date} className="border-t border-white/5 text-zinc-200">
                <td className="px-5 py-3">{formatDate(row.event_date)}</td>
                <td className="px-5 py-3">{row.dau}</td>
                <td className="px-5 py-3">{row.onboarding_completions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RetentionTable({ rows }: { rows: AnalyticsDay1RetentionRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold text-white">Next-Day Return</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Cohort retention for users who completed onboarding.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-zinc-400">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Cohort</th>
              <th className="px-5 py-3 text-left font-medium">Onboardings</th>
              <th className="px-5 py-3 text-left font-medium">Returned D+1</th>
              <th className="px-5 py-3 text-left font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.cohort_date} className="border-t border-white/5 text-zinc-200">
                <td className="px-5 py-3">{formatDate(row.cohort_date)}</td>
                <td className="px-5 py-3">{row.onboarding_completions}</td>
                <td className="px-5 py-3">{row.next_day_returners}</td>
                <td className="px-5 py-3">{row.next_day_return_rate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAnalyticsOverview()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold text-white">Analytics</h1>
        <p className="text-zinc-500">Loading analytics…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold text-white">Analytics</h1>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Insights</p>
        <h1 className="text-3xl font-semibold text-white">Analytics</h1>
        <p className="max-w-2xl text-zinc-400">
          Track onboarding completions, daily active users, and next-day return
          without adding a full analytics SDK.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="DAU Today"
          value={String(data.totals.dau_today)}
          hint="Unique devices that opened the app today"
        />
        <StatCard
          label="Onboardings Today"
          value={String(data.totals.onboardings_today)}
          hint="Completed onboarding today"
        />
        <StatCard
          label="Latest D+1 Return"
          value={
            data.totals.latest_day1_return_rate === null
              ? '—'
              : `${data.totals.latest_day1_return_rate.toFixed(2)}%`
          }
          hint="Latest cohort next-day retention"
        />
        <StatCard
          label="Total Onboardings"
          value={String(data.totals.total_onboarding_completions)}
          hint="All tracked onboarding completions"
        />
      </div>

      {data.daily_summary.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-zinc-400">
          No analytics events yet. Run the `008_analytics_events.sql` migration and
          open the mobile app to begin collecting data.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <DailyTable rows={data.daily_summary} />
          <RetentionTable rows={data.day1_retention} />
        </div>
      )}
    </section>
  );
}
