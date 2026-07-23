import { useState } from 'react';
import { Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { api } from '../lib/api';

const REPORTS = [
  { key: 'daily', label: 'Daily Report', params: ['date'] },
  { key: 'monthly', label: 'Monthly Report', params: ['from', 'to'] },
  { key: 'utilization', label: 'Coupon Utilization Report', params: ['year', 'month'] },
];

export function Reports() {
  const [reportKey, setReportKey] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [downloading, setDownloading] = useState(false);

  async function download(format: 'excel' | 'pdf') {
    setDownloading(true);
    try {
      const params: Record<string, string | number> =
        reportKey === 'daily' ? { date, format } : reportKey === 'monthly' ? { from: date, to: date, format } : { year, month, format };
      const res = await api.get(`/admin/reports/${reportKey}`, { params, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportKey}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Stack spacing={2} maxWidth={480}>
      <Typography variant="h5">Reports</Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField select label="Report" value={reportKey} onChange={(e) => setReportKey(e.target.value)}>
            {REPORTS.map((r) => (
              <MenuItem key={r.key} value={r.key}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>

          {reportKey !== 'utilization' && (
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          )}
          {reportKey === 'utilization' && (
            <Stack direction="row" spacing={2}>
              <TextField label="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              <TextField label="Month" type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
            </Stack>
          )}

          <Stack direction="row" spacing={2}>
            <Button variant="contained" disabled={downloading} onClick={() => download('excel')}>
              Export Excel
            </Button>
            <Button variant="outlined" disabled={downloading} onClick={() => download('pdf')}>
              Export PDF
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
