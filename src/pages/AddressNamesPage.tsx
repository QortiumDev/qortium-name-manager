import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BadgeIcon from '@mui/icons-material/Badge';
import { useColors } from '../theme/ColorTokensContext';
import { tokens } from '../theme/tokens';
import { fetchNamesByAddress, fetchPrimaryNames } from '../api/rest';

type NameEntry = { name: string; owner: string; isForSale?: boolean; salePrice?: number | null };

export function AddressNamesPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const c = useColors();

  const [names, setNames]             = useState<NameEntry[]>([]);
  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([
      fetchNamesByAddress(address),
      fetchPrimaryNames([address]),
    ]).then(([ns, nameMap]) => {
      setNames(ns);
      setPrimaryName(nameMap.get(address) ?? null);
    }).finally(() => setLoading(false));
  }, [address]);

  const truncAddr = address ? `${address.slice(0, 10)}…${address.slice(-6)}` : '';
  const displayId = primaryName ?? truncAddr;

  return (
    <Box sx={{ pt: `${tokens.spacing.topBarHeight + 24}px`, pb: 4, px: { xs: 2, md: 4 }, maxWidth: 720, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button onClick={() => navigate(-1)} size="small" startIcon={<ArrowBackIcon />}
          sx={{ color: c.textSecondary, fontWeight: tokens.typography.weightBold, fontSize: '0.72rem', minWidth: 0, p: 0, '&:hover': { color: c.accent, bgcolor: 'transparent' } }}>
          Back
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: tokens.typography.weightBlack, color: c.textPrimary, letterSpacing: '-0.01em', mb: 0.25 }}>
          {displayId}
        </Typography>
        {primaryName && (
          <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: c.textSecondary, mb: 0.5 }}>
            {truncAddr}
          </Typography>
        )}
        <Typography sx={{ fontSize: '0.78rem', color: c.textSecondary, mt: 0.5 }}>
          {loading ? 'Loading names…' : `${names.length} name${names.length !== 1 ? 's' : ''}`}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} sx={{ color: c.accent }} />
        </Box>
      ) : names.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
          <BadgeIcon sx={{ fontSize: '2rem', color: c.textSecondary, opacity: 0.3 }} />
          <Typography sx={{ fontSize: '0.85rem', color: c.textSecondary }}>No names registered to this address.</Typography>
        </Box>
      ) : (
        <Box sx={{ border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: `${tokens.shape.radius}px`, bgcolor: c.surface, overflow: 'hidden' }}>
          {names.map((n, i) => (
            <Box
              key={n.name}
              onClick={() => navigate(`/name/${encodeURIComponent(n.name)}`)}
              sx={{
                px: 2.5, py: 1.5,
                display: 'flex', alignItems: 'center', gap: 2,
                borderBottom: i < names.length - 1 ? `1px solid ${c.borderLight}` : 'none',
                cursor: 'pointer',
                '&:hover': { bgcolor: c.borderLight },
                transition: '0.12s ease',
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary, flex: 1 }}>
                {n.name}
              </Typography>
              {n.isForSale && n.salePrice != null && (
                <Chip
                  label={`${n.salePrice.toLocaleString()} QORT`}
                  size="small"
                  sx={{ fontSize: '0.6rem', height: 18, bgcolor: `${c.success}22`, color: c.success, border: `1px solid ${c.success}44` }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
