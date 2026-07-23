import { useEffect, useState } from 'react';
import { Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { api } from '../lib/api';

interface FeedbackAnalytics {
  averageRating: number;
  mostCommonCategories: { category: string; count: string }[];
  dailyTrend: { day: string; avgRating: string; count: string }[];
}

export function Feedback() {
  const [data, setData] = useState<FeedbackAnalytics | null>(null);

  useEffect(() => {
    api.get<FeedbackAnalytics>('/admin/reports/feedback').then((res) => setData(res.data));
  }, []);

  if (!data) return <Typography>Loading feedback analytics…</Typography>;

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Feedback Analytics</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Average Rating
        </Typography>
        <Typography variant="h3" fontWeight={700}>
          {data.averageRating.toFixed(1)} ★
        </Typography>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Most Common Complaint Categories
        </Typography>
        <Grid container spacing={2}>
          {data.mostCommonCategories.map((c) => (
            <Grid item xs={12} key={c.category}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{c.category}</Typography>
                <Typography variant="body2">{c.count}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (Number(c.count) / Number(data.mostCommonCategories[0]?.count || 1)) * 100)}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Stack>
  );
}
