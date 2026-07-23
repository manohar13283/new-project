import { useEffect, useState } from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  ArcElement,
} from 'chart.js';
import { api } from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

interface Kpis {
  byType: { type: string; count: string }[];
  byDepartment: { department: string; count: string }[];
  byShift: { shift: string; count: string }[];
  unusedCoupons: number;
  workerUsagePercent: number;
  activeWorkers: number;
  peakTime: string | null;
}

export function Analytics() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    api.get<Kpis>('/admin/analytics/kpis').then((res) => setKpis(res.data));
  }, []);

  if (!kpis) return <Typography>Loading analytics…</Typography>;

  const kpiCards = [
    ['Active Workers', kpis.activeWorkers],
    ['Worker Usage %', `${kpis.workerUsagePercent}%`],
    ['Unused Coupons', kpis.unusedCoupons],
    ['Peak Time', kpis.peakTime ? new Date(kpis.peakTime).toLocaleString() : '—'],
  ] as const;

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {kpiCards.map(([label, value]) => (
          <Grid item xs={12} sm={3} key={label}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Consumption by Coupon Type
            </Typography>
            <Bar
              data={{
                labels: kpis.byType.map((t) => t.type),
                datasets: [{ label: 'Count', data: kpis.byType.map((t) => Number(t.count)), backgroundColor: '#1E6F5C' }],
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Shift-wise Consumption
            </Typography>
            <Pie
              data={{
                labels: kpis.byShift.map((s) => s.shift),
                datasets: [{ data: kpis.byShift.map((s) => Number(s.count)), backgroundColor: ['#1E6F5C', '#F4A300', '#3B82F6'] }],
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Department-wise Consumption
            </Typography>
            <Line
              data={{
                labels: kpis.byDepartment.map((d) => d.department),
                datasets: [{ label: 'Count', data: kpis.byDepartment.map((d) => Number(d.count)), borderColor: '#1E6F5C' }],
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
