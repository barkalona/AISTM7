'use client';

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import IBKRConnection from '@/components/IBKRConnection';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function IBKRSettingsPage() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link href="/dashboard" passHref>
            <MuiLink color="inherit">Dashboard</MuiLink>
          </Link>
          <Link href="/settings" passHref>
            <MuiLink color="inherit">Settings</MuiLink>
          </Link>
          <Typography color="text.primary">IBKR Connection</Typography>
        </Breadcrumbs>

        <Paper sx={{ p: 4 }}>
          <Box mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              IBKR Account Connection
            </Typography>
            <Typography color="text.secondary" paragraph>
              Connect your Interactive Brokers account to enable portfolio analysis and risk management features.
              Your credentials are securely encrypted and stored.
            </Typography>
          </Box>

          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              Security Information
            </Typography>
            <Typography component="div">
              <ul>
                <li>Your IBKR credentials are encrypted using AES-256-GCM encryption.</li>
                <li>Credentials are only used to establish a secure connection with IBKR.</li>
                <li>The system only reads portfolio data and never executes trades.</li>
                <li>You can disconnect your account at any time.</li>
                <li>Connection status is monitored in real-time.</li>
              </ul>
            </Typography>
          </Box>

          <IBKRConnection />

          <Box mt={4}>
            <Typography variant="body2" color="text.secondary">
              Note: This integration uses the IBKR Client Portal API. Make sure you have enabled API access
              in your IBKR account settings and that the Client Portal Gateway is running on your machine.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
}