import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, InputAdornment, TextField, Tooltip, Typography, Alert, Select, MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAtomValue } from 'jotai';
import { useColors } from '../theme/ColorTokensContext';
import { tokens } from '../theme/tokens';
import { accountAtom } from '../state/atoms';
import { buyName, registerName } from '../api/qortal';
import { fetchNamesForSale, searchNamesForSale, fetchPrimaryNames, fetchNameData } from '../api/rest';

const LIMIT = 20;

type NameForSale = { name: string; owner: string; salePrice: number };
type NameRecord   = { name: string; owner: string; isForSale: boolean; salePrice: number | null };
type SortMode = 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'default',    label: 'Default'  },
  { value: 'name-asc',   label: 'A → Z'    },
  { value: 'name-desc',  label: 'Z → A'    },
  { value: 'price-asc',  label: 'Price ↑'  },
  { value: 'price-desc', label: 'Price ↓'  },
];

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

function BuyDialog({ entry, onClose, onSuccess }: { entry: NameForSale; onClose: () => void; onSuccess: () => void }) {
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setBusy(true); setErr(null);
    try { await buyName(entry.name); onSuccess(); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: c.surface, border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: 0 } }}>
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: `${tokens.shape.borderWidth} solid ${c.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
        Buy "{entry.name}"
        <IconButton size="small" onClick={onClose} sx={{ color: c.textSecondary }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ fontSize: '0.85rem', color: c.textPrimary }}>
          Purchase <strong>{entry.name}</strong> from{' '}
          <Box component="span" sx={{ color: c.textSecondary }}>{truncateAddress(entry.owner)}</Box>{' '}
          for{' '}
          <Box component="span" sx={{ color: c.success, fontWeight: tokens.typography.weightBold }}>
            {entry.salePrice.toLocaleString()} QORT
          </Box>?
        </Typography>
        {err && <Alert severity="error" sx={{ fontSize: '0.78rem', py: 0 }}>{err}</Alert>}
        <Button
          variant="contained" disableElevation onClick={() => { void confirm(); }} disabled={busy}
          sx={{ bgcolor: c.accent, color: c.accentText, borderRadius: 0, '&:hover': { bgcolor: c.accentHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.accent, color: c.accentText } }}
        >
          {busy ? <CircularProgress size={14} sx={{ color: c.accentText }} /> : `Buy for ${entry.salePrice.toLocaleString()} QORT`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function NameRow({ entry, isOwn, sellerName, onBuy }: { entry: NameForSale; isOwn: boolean; sellerName: string | null; onBuy: () => void }) {
  const c = useColors();
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      px: 2.5, py: 1.75,
      borderBottom: `1px solid ${c.borderLight}`,
      '&:last-child': { borderBottom: 'none' },
      '&:hover': { bgcolor: c.borderLight },
      transition: '0.12s ease',
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.name}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', color: c.textSecondary, fontFamily: sellerName ? 'inherit' : 'monospace' }}>
          {sellerName ?? truncateAddress(entry.owner)}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: tokens.typography.weightBold, color: c.success, whiteSpace: 'nowrap' }}>
        {entry.salePrice.toLocaleString()} QORT
      </Typography>
      {isOwn ? (
        <Tooltip title="This is your listing" placement="left">
          <Typography sx={{ fontSize: '0.65rem', fontWeight: tokens.typography.weightBold, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSecondary, whiteSpace: 'nowrap' }}>
            Your listing
          </Typography>
        </Tooltip>
      ) : (
        <Button
          variant="contained" disableElevation size="small" onClick={onBuy}
          sx={{ bgcolor: c.accent, color: c.accentText, borderRadius: '50px', fontSize: '0.72rem', px: 1.75, whiteSpace: 'nowrap', '&:hover': { bgcolor: c.accentHover } }}
        >
          Buy
        </Button>
      )}
    </Box>
  );
}

interface Props {
  initialQuery?: string;
  exact?: boolean;
}

export function MarketplacePage({ initialQuery, exact }: Props) {
  const c = useColors();
  const account = useAtomValue(accountAtom);

  const [inputValue, setInputValue] = useState(initialQuery ?? '');
  const [query, setQuery]           = useState(initialQuery ?? '');
  const [names, setNames]           = useState<NameForSale[]>([]);
  const [ownerNames, setOwnerNames] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading]       = useState(true);
  const [bgLoading, setBgLoading]   = useState(false);
  const [buyTarget, setBuyTarget]   = useState<NameForSale | null>(null);

  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const hasFilters = minPrice !== '' || maxPrice !== '';

  // Exact-name ownership state (only used when exact=true)
  const [nameRecord,    setNameRecord]    = useState<NameRecord | null | undefined>(exact ? undefined : null);
  const [ownerPrimary,  setOwnerPrimary]  = useState<string | null>(null);
  const [registering,   setRegistering]   = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerDone,  setRegisterDone]  = useState(false);

  // Generation counter — incremented on each new search so stale loops self-cancel
  const genRef = useRef(0);

  const loadAll = useCallback(async (q: string) => {
    const gen = ++genRef.current;
    setNames([]);
    setOwnerNames(new Map());
    setLoading(true);
    setBgLoading(false);

    if (q) {
      // Search: single large fetch, no pagination needed
      const results = await searchNamesForSale(q, 200);
      if (gen !== genRef.current) return;
      setNames(results);
      setLoading(false);
      if (results.length > 0) {
        const addrs = [...new Set(results.map(n => n.owner))];
        void fetchPrimaryNames(addrs).then(m => {
          if (gen === genRef.current) setOwnerNames(m);
        });
      }
      return;
    }

    // Default browse: paginate through all pages in the background
    let offset = 0;
    let first  = true;

    while (true) {
      const page = await fetchNamesForSale(LIMIT, offset);
      if (gen !== genRef.current) return;

      if (first) {
        setNames(page);
        setLoading(false);
        first = false;
      } else {
        setNames(prev => [...prev, ...page]);
      }

      // Resolve owner names for this page incrementally
      if (page.length > 0) {
        const addrs = [...new Set(page.map(n => n.owner))];
        void fetchPrimaryNames(addrs).then(m => {
          if (gen === genRef.current) setOwnerNames(prev => new Map([...prev, ...m]));
        });
      }

      if (page.length < LIMIT) {
        setBgLoading(false);
        return;
      }

      offset += page.length;
      setBgLoading(true);
    }
  }, []);

  useEffect(() => {
    void loadAll(query);
  }, [query, loadAll]);

  useEffect(() => {
    if (!exact || !initialQuery) return;
    setNameRecord(undefined);
    setOwnerPrimary(null);
    setRegisterDone(false);
    setRegisterError(null);
    void fetchNameData(initialQuery).then(async record => {
      setNameRecord(record);
      if (record) {
        const map = await fetchPrimaryNames([record.owner]);
        setOwnerPrimary(map.get(record.owner) ?? null);
      }
    });
  }, [exact, initialQuery]);

  async function handleRegister() {
    if (!initialQuery) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      await registerName(initialQuery);
      setRegisterDone(true);
      const record = await fetchNameData(initialQuery);
      setNameRecord(record);
      if (record) {
        const map = await fetchPrimaryNames([record.owner]);
        setOwnerPrimary(map.get(record.owner) ?? null);
      }
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : String(e));
    } finally {
      setRegistering(false);
    }
  }

  const visibleNames = useMemo(() => {
    let result = exact && initialQuery
      ? names.filter(n => n.name === initialQuery)
      : names;
    const min = minPrice !== '' ? parseFloat(minPrice) : null;
    const max = maxPrice !== '' ? parseFloat(maxPrice) : null;
    if (min != null && !isNaN(min)) result = result.filter(n => n.salePrice >= min);
    if (max != null && !isNaN(max)) result = result.filter(n => n.salePrice <= max);
    if (sortMode === 'name-asc')   return [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'name-desc')  return [...result].sort((a, b) => b.name.localeCompare(a.name));
    if (sortMode === 'price-asc')  return [...result].sort((a, b) => a.salePrice - b.salePrice);
    if (sortMode === 'price-desc') return [...result].sort((a, b) => b.salePrice - a.salePrice);
    return result;
  }, [names, sortMode, minPrice, maxPrice, exact, initialQuery]);

  function handleSearch() { setQuery(inputValue.trim()); }
  function clearFilters() { setMinPrice(''); setMaxPrice(''); }

  const fieldSx = { '& .MuiOutlinedInput-root': { fontSize: '0.82rem', '& fieldset': { borderColor: c.borderLight }, '&:hover fieldset': { borderColor: c.accent }, '&.Mui-focused fieldset': { borderColor: c.accent } } };

  return (
    <Box sx={{ pt: `${tokens.spacing.topBarHeight + 24}px`, pb: 4, px: { xs: 2, md: 4 }, maxWidth: 720, mx: 'auto' }}>

      {/* Header with bg-loading indicator */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <StorefrontIcon sx={{ fontSize: '1rem', color: c.textSecondary }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: tokens.typography.weightBold, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textSecondary }}>
            Marketplace
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
            Names for sale
          </Typography>
          {bgLoading && (
            <>
              <CircularProgress size={13} thickness={5} sx={{ color: c.accent, opacity: 0.6 }} />
              <Typography sx={{ fontSize: '0.65rem', color: c.textSecondary }}>
                {names.length} loaded…
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <TextField
          size="small" fullWidth placeholder="Search names…"
          value={inputValue} onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: c.textSecondary }} /></InputAdornment> } }}
          sx={fieldSx}
        />
        <Button
          variant="contained" disableElevation onClick={handleSearch}
          sx={{ bgcolor: c.accent, color: c.accentText, borderRadius: '50px', px: 2.5, fontSize: '0.75rem', whiteSpace: 'nowrap', '&:hover': { bgcolor: c.accentHover } }}
        >
          Search
        </Button>
      </Box>

      {/* Sort + price filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Select
          size="small" value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}
          sx={{ fontSize: '0.72rem', height: 28, '& fieldset': { borderColor: c.borderLight }, '& .MuiSelect-select': { py: '3px', pr: '28px !important' } }}
        >
          {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.72rem' }}>{o.label}</MenuItem>)}
        </Select>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto', flexShrink: 0 }}>
          <TextField
            size="small" placeholder="Min" type="number"
            value={minPrice} onChange={e => setMinPrice(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            sx={{ ...fieldSx, width: 80 }}
          />
          <Typography sx={{ fontSize: '0.72rem', color: c.textSecondary }}>—</Typography>
          <TextField
            size="small" placeholder="Max" type="number"
            value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            sx={{ ...fieldSx, width: 80 }}
          />
          {hasFilters && (
            <Tooltip title="Clear price filter" placement="top">
              <IconButton size="small" onClick={clearFilters} sx={{ color: c.textSecondary, '&:hover': { color: c.error } }}>
                <CloseIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}
          <Typography sx={{ fontSize: '0.65rem', color: c.textSecondary, fontWeight: tokens.typography.weightBold, letterSpacing: '0.06em' }}>
            QORT
          </Typography>
        </Box>
      </Box>

      {/* List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} sx={{ color: c.accent }} />
        </Box>
      ) : exact && initialQuery && visibleNames.length === 0 ? (
        <Box sx={{ border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: `${tokens.shape.radius}px`, bgcolor: c.surface, p: 3 }}>
          {nameRecord === undefined ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} sx={{ color: c.accent }} />
            </Box>
          ) : nameRecord === null ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
                "{initialQuery}" is not registered
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: c.textSecondary }}>
                This name is available — register it now.
              </Typography>
              {registerError && <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0 }}>{registerError}</Alert>}
              {registerDone ? (
                <Typography sx={{ fontSize: '0.78rem', color: c.success, fontWeight: tokens.typography.weightMedium }}>
                  "{initialQuery}" registered successfully.
                </Typography>
              ) : (
                <Button
                  variant="contained" disableElevation size="small" onClick={() => { void handleRegister(); }} disabled={registering}
                  sx={{ alignSelf: 'flex-start', bgcolor: c.accent, color: c.accentText, borderRadius: '50px', fontSize: '0.72rem', px: 2, '&:hover': { bgcolor: c.accentHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.accent, color: c.accentText } }}
                >
                  {registering ? <CircularProgress size={12} sx={{ color: c.accentText }} /> : 'Register this name'}
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
                "{initialQuery}" is not for sale
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: c.textSecondary }}>
                {nameRecord.owner === account?.address
                  ? 'You own this name.'
                  : ownerPrimary === initialQuery
                    ? 'Owned, not for sale.'
                    : ownerPrimary
                      ? <>Owned by <Box component="span" sx={{ color: c.textPrimary, fontWeight: tokens.typography.weightMedium }}>{ownerPrimary}</Box>.</>
                      : <>Owned by <Box component="span" sx={{ fontFamily: 'monospace', color: c.textPrimary }}>{truncateAddress(nameRecord.owner)}</Box>.</>
                }
              </Typography>
            </Box>
          )}
        </Box>
      ) : names.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography sx={{ fontSize: '0.85rem', color: c.textSecondary }}>
            {query ? `No names for sale matching "${query}".` : 'No names listed for sale.'}
          </Typography>
        </Box>
      ) : visibleNames.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Typography sx={{ fontSize: '0.85rem', color: c.textSecondary }}>
            No names match your current filters.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: `${tokens.shape.radius}px`, bgcolor: c.surface, mb: 2, overflow: 'hidden' }}>
          {visibleNames.map(entry => (
            <NameRow
              key={entry.name}
              entry={entry}
              isOwn={entry.owner === account?.address}
              sellerName={ownerNames.get(entry.owner) ?? null}
              onBuy={() => setBuyTarget(entry)}
            />
          ))}
        </Box>
      )}

      {buyTarget && (
        <BuyDialog
          entry={buyTarget}
          onClose={() => setBuyTarget(null)}
          onSuccess={() => setNames(prev => prev.filter(n => n.name !== buyTarget.name))}
        />
      )}
    </Box>
  );
}
