'use client';

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import {
  Security as SecurityIcon,
  AccountBox as AccountIcon,
  Notifications as NotificationsIcon,
  AccountBalance as AccountBalanceIcon,
  VpnKey as ApiKeyIcon,
  Shield as TwoFactorIcon
} from '@mui/icons-material';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Account Settings',
      items: [
        {
          title: 'Profile Settings',
          description: 'Update your name, email, and other account details',
          icon: <AccountIcon />,
          href: '/settings/profile'
        },
        {
          title: 'Security Settings',
          description: 'Manage your password and security preferences',
          icon: <SecurityIcon />,
          href: '/settings/security'
        },
        {
          title: 'Two-Factor Authentication',
          description: 'Set up and manage two-factor authentication',
          icon: <TwoFactorIcon />,
          href: '/settings/two-factor/setup'
        }
      ]
    },
    {
      title: 'Integration Settings',
      items: [
        {
          title: 'IBKR Connection',
          description: 'Connect and manage your Interactive Brokers account',
          icon: <AccountBalanceIcon />,
          href: '/settings/ibkr'
        },
        {
          title: 'API Keys',
          description: 'View and manage your API keys',
          icon: <ApiKeyIcon />,
          href: '/settings/api-keys'
        }
      ]
    },
    {
      title: 'Notification Settings',
      items: [
        {
          title: 'Notification Preferences',
          description: 'Configure email and SMS notifications',
          icon: <NotificationsIcon />,
          href: '/settings/notifications'
        }
      ]
    }
  ];

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link href="/dashboard" passHref>
            <MuiLink color="inherit">Dashboard</MuiLink>
          </Link>
          <Typography color="text.primary">Settings</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        {settingsSections.map((section, index) => (
          <Paper key={section.title} sx={{ mt: 3 }}>
            <Box p={3}>
              <Typography variant="h6" gutterBottom>
                {section.title}
              </Typography>
              <List>
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={item.title}>
                    <ListItem disablePadding>
                      <Link href={item.href} passHref style={{ width: '100%', textDecoration: 'none' }}>
                        <ListItemButton>
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText
                            primary={item.title}
                            secondary={item.description}
                            primaryTypographyProps={{
                              color: 'text.primary'
                            }}
                          />
                        </ListItemButton>
                      </Link>
                    </ListItem>
                    {itemIndex < section.items.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Paper>
        ))}
      </Container>
    </ProtectedRoute>
  );
}