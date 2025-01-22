import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DisconnectIcon from '@mui/icons-material/LinkOff';
import { api } from '../services/api';

interface ConnectionStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: string;
  lastError?: string;
}

const IBKRConnection: React.FC = () => {
  const { data: session } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
    // Check status periodically
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/ibkr/status');
      setConnectionStatus(response.data);
    } catch (err) {
      console.error('Error checking connection status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ibkr/connect', {
        username,
        password
      });

      if (response.data.success) {
        setConnectionStatus({
          connected: true,
          status: 'connected'
        });
        // Clear sensitive form data
        setUsername('');
        setPassword('');
      } else {
        setError(response.data.error || 'Failed to connect to IBKR');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect to IBKR');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/ibkr/disconnect');
      setConnectionStatus({
        connected: false,
        status: 'disconnected'
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect from IBKR');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = () => {
    if (!connectionStatus) return null;

    const statusConfig = {
      connected: {
        icon: <CheckCircleIcon />,
        color: 'success' as const,
        label: 'Connected'
      },
      disconnected: {
        icon: <DisconnectIcon />,
        color: 'default' as const,
        label: 'Disconnected'
      },
      error: {
        icon: <ErrorIcon />,
        color: 'error' as const,
        label: 'Error'
      }
    };

    const config = statusConfig[connectionStatus.status];

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        sx={{ ml: 2 }}
      />
    );
  };

  if (checkingStatus) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Typography variant="h6" component="h2">
          IBKR Account Connection
        </Typography>
        {getStatusChip()}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {connectionStatus?.lastError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Last Error: {connectionStatus.lastError}
        </Alert>
      )}

      {!connectionStatus?.connected ? (
        <form onSubmit={handleConnect}>
          <TextField
            label="IBKR Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="off"
          />
          <TextField
            label="IBKR Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoComplete="off"
          />
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            startIcon={<LockIcon />}
            fullWidth
            sx={{ mt: 2 }}
          >
            Connect IBKR Account
          </LoadingButton>
        </form>
      ) : (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your IBKR account is connected
            {connectionStatus.lastConnected && (
              <Typography variant="caption" display="block">
                Last connected: {new Date(connectionStatus.lastConnected).toLocaleString()}
              </Typography>
            )}
          </Alert>
          <LoadingButton
            onClick={handleDisconnect}
            variant="outlined"
            color="error"
            loading={loading}
            startIcon={<DisconnectIcon />}
            fullWidth
          >
            Disconnect IBKR Account
          </LoadingButton>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
        Your credentials are encrypted and stored securely. We never store your password in plain text.
      </Typography>
    </Box>
  );
};

export default IBKRConnection;