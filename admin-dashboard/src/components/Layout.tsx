import { ReactNode } from 'react';
import { AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';
import DescriptionIcon from '@mui/icons-material/Description';
import ReviewsIcon from '@mui/icons-material/Reviews';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Live Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Workers', icon: <GroupIcon />, path: '/workers' },
  { label: 'Analytics', icon: <InsightsIcon />, path: '/analytics' },
  { label: 'Reports', icon: <DescriptionIcon />, path: '/reports' },
  { label: 'Feedback', icon: <ReviewsIcon />, path: '/feedback' },
];

export function Layout({ children, mode, onToggleMode }: { children: ReactNode; mode: 'light' | 'dark'; onToggleMode: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            🍽 My Union Canteen — Admin
          </Typography>
          <Typography variant="body2">{admin?.email}</Typography>
          <IconButton color="inherit" onClick={onToggleMode}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{ width: DRAWER_WIDTH, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
      >
        <Toolbar />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton key={item.path} selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
