import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface AnalyticsDailySummaryRow {
  event_date: string;
  dau: number;
  onboarding_completions: number;
}

export interface AnalyticsDay1RetentionRow {
  cohort_date: string;
  onboarding_completions: number;
  next_day_returners: number;
  next_day_return_rate: number;
}

export interface AnalyticsOverviewDto {
  totals: {
    dau_today: number;
    onboardings_today: number;
    latest_day1_return_rate: number | null;
    total_onboarding_completions: number;
  };
  daily_summary: AnalyticsDailySummaryRow[];
  day1_retention: AnalyticsDay1RetentionRow[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabase: SupabaseService) {}

  private get sup() {
    return this.supabase.getClient();
  }

  async getOverview(): Promise<AnalyticsOverviewDto> {
    const [{ data: dailySummary, error: dailyError }, { data: retention, error: retentionError }] =
      await Promise.all([
        this.sup
          .from('analytics_daily_summary')
          .select('event_date, dau, onboarding_completions')
          .order('event_date', { ascending: false })
          .limit(30),
        this.sup
          .from('analytics_day1_retention')
          .select(
            'cohort_date, onboarding_completions, next_day_returners, next_day_return_rate',
          )
          .order('cohort_date', { ascending: false })
          .limit(30),
      ]);

    if (dailyError) {
      throw new Error(dailyError.message);
    }

    if (retentionError) {
      throw new Error(retentionError.message);
    }

    const daily = ((dailySummary ?? []) as AnalyticsDailySummaryRow[]).map((row) => ({
      ...row,
      dau: Number(row.dau ?? 0),
      onboarding_completions: Number(row.onboarding_completions ?? 0),
    }));

    const day1 = ((retention ?? []) as AnalyticsDay1RetentionRow[]).map((row) => ({
      ...row,
      onboarding_completions: Number(row.onboarding_completions ?? 0),
      next_day_returners: Number(row.next_day_returners ?? 0),
      next_day_return_rate: Number(row.next_day_return_rate ?? 0),
    }));

    return {
      totals: {
        dau_today: daily[0]?.dau ?? 0,
        onboardings_today: daily[0]?.onboarding_completions ?? 0,
        latest_day1_return_rate:
          day1.length > 0 ? day1[0]?.next_day_return_rate ?? 0 : null,
        total_onboarding_completions: daily.reduce(
          (sum, row) => sum + row.onboarding_completions,
          0,
        ),
      },
      daily_summary: daily,
      day1_retention: day1,
    };
  }
}
