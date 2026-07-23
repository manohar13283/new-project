import { Avatar, Box, Chip, Grid, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { useMemo } from 'react';
import { useScanFeed } from '../hooks/useScanFeed';

const COUPON_ICON: Record<string, string> = { BREAKFAST_TEA: '🍳', MEAL: '🍛', TEA: '☕' };

export function LiveDashboard() {
  const { events, connected } = useScanFeed(200);

  const todayCounts = useMemo(() => {
    const counts = { BREAKFAST_TEA: 0, MEAL: 0, TEA: 0 };
    events.forEach((e) => {
      if (e.status === 'SUCCESS' && e.couponType in counts) {
        counts[e.couponType as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [events]);

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {(
          [
            ['Breakfast + Tea', todayCounts.BREAKFAST_TEA, '🍳'],
            ['Meal', todayCounts.MEAL, '🍛'],
            ['Tea', todayCounts.TEA, '☕'],
          ] as const
        ).map(([label, count, icon]) => (
          <Grid item xs={12} sm={4} key={label}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {icon} {label}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {count}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Live Scan Feed</Typography>
          <Chip
            icon={<CircleIcon sx={{ fontSize: 12, color: connected ? 'success.main' : 'error.main' }} />}
            label={connected ? 'Live' : 'Disconnected'}
            variant="outlined"
          />
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Clock #</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Coupon</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.transactionId}>
                <TableCell>
                  <Avatar src={e.photoUrl ?? undefined} sx={{ width: 28, height: 28 }}>
                    {e.workerName[0]}
                  </Avatar>
                </TableCell>
                <TableCell>{e.workerName}</TableCell>
                <TableCell>{e.clockNumber}</TableCell>
                <TableCell>{e.department}</TableCell>
                <TableCell>{e.shift}</TableCell>
                <TableCell>
                  {COUPON_ICON[e.couponType]} {e.couponType.replace('_', ' + ')}
                </TableCell>
                <TableCell>{e.time}</TableCell>
                <TableCell>
                  <Chip size="small" label={e.status} color={e.status === 'SUCCESS' ? 'success' : 'error'} />
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>Waiting for scans…</Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
