import { useEffect, useState } from 'react';
import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { api } from '../lib/api';

interface WorkerRow {
  id: string;
  clockNumber: string;
  fullName: string;
  isActive: boolean;
  department: { name: string };
  shift: { code: string };
}

export function Workers() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<WorkerRow[]>('/admin/workers', { params: { search: search || undefined } });
      setWorkers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Workers</Typography>
        <Button variant="contained">+ Add Worker</Button>
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          size="small"
          placeholder="Search by name or clock number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          sx={{ minWidth: 320 }}
        />
        <Button onClick={load}>Search</Button>
      </Stack>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Clock #</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((w) => (
              <TableRow key={w.id} hover>
                <TableCell>{w.clockNumber}</TableCell>
                <TableCell>{w.fullName}</TableCell>
                <TableCell>{w.department?.name}</TableCell>
                <TableCell>{w.shift?.code}</TableCell>
                <TableCell>
                  <Chip size="small" label={w.isActive ? 'Active' : 'Inactive'} color={w.isActive ? 'success' : 'default'} />
                </TableCell>
              </TableRow>
            ))}
            {!loading && workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No workers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
