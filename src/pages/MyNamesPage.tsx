import { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, CircularProgress, Checkbox, Dialog, DialogContent, DialogTitle,
  FormControlLabel, IconButton, TextField, Typography, Alert, Chip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import BadgeIcon from '@mui/icons-material/Badge';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SendIcon from '@mui/icons-material/Send';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useAtomValue } from 'jotai';
import { useColors } from '../theme/ColorTokensContext';
import { tokens } from '../theme/tokens';
import { accountAtom, uiStyleAtom } from '../state/atoms';
import { getAccountNames, registerName, updateName, sellName, cancelSellName, ensureAccountUnlocked } from '../api/qortal';

type NameEntry = { name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number; saleRecipient?: string | null };
type Status = { type: 'success' | 'error'; msg: string } | null;
type SellMode = 'public' | 'private';

function isLikelyAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{25,36}$/.test(value.trim());
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

function SellDialog({ name, onClose, onSuccess }: { name: string; onClose: () => void; onSuccess: () => void }) {
  const c = useColors();
  const [mode, setMode] = useState<SellMode>('public');
  const [price, setPrice] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = parseFloat(price);
  const priceValid = !isNaN(parsed) && parsed > 0;
  const recipientValid = isLikelyAddress(recipient);
  const valid = mode === 'public'
    ? priceValid
    : recipientValid && (isGift || priceValid);

  async function confirm() {
    if (!valid) return;
    setBusy(true); setErr(null);
    try {
      if (!await ensureAccountUnlocked()) return;
      const amount = mode === 'private' && isGift ? 0 : parsed;
      await sellName(name, amount, mode === 'private' ? recipient.trim() : undefined);
      onSuccess(); onClose();
    }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const toggleSx = {
    flex: 1, textTransform: 'none', fontSize: '0.78rem', gap: 0.75, py: 0.75,
    color: c.textSecondary, borderColor: c.borderLight,
    '&.Mui-selected': { bgcolor: `${c.accent}18`, color: c.accent, borderColor: c.accent, '&:hover': { bgcolor: `${c.accent}26` } },
  };
  const fieldSx = { '& .MuiOutlinedInput-root': { fontSize: '0.85rem', '& fieldset': { borderColor: c.borderLight }, '&:hover fieldset': { borderColor: c.accent }, '&.Mui-focused fieldset': { borderColor: c.accent } } };

  let buttonLabel: string;
  if (mode === 'public') buttonLabel = `List for ${priceValid ? parsed.toLocaleString() : '?'} QORT`;
  else if (isGift) buttonLabel = 'Send gift';
  else buttonLabel = `Send for ${priceValid ? parsed.toLocaleString() : '?'} QORT`;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: c.surface, border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: 0 } }}>
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: `${tokens.shape.borderWidth} solid ${c.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
        Sell "{name}"
        <IconButton size="small" onClick={onClose} sx={{ color: c.textSecondary }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ToggleButtonGroup
          exclusive fullWidth value={mode}
          onChange={(_, v) => { if (v) setMode(v as SellMode); }}
          sx={{ '& .MuiToggleButtonGroup-grouped': { borderRadius: `${tokens.shape.radius}px !important`, border: `${tokens.shape.borderWidth} solid ${c.borderLight} !important` } }}
        >
          <ToggleButton value="public" sx={toggleSx}><StorefrontIcon sx={{ fontSize: '1rem' }} />Public listing</ToggleButton>
          <ToggleButton value="private" sx={toggleSx}><SendIcon sx={{ fontSize: '1rem' }} />Send to address</ToggleButton>
        </ToggleButtonGroup>

        <Typography sx={{ fontSize: '0.82rem', color: c.textSecondary }}>
          {mode === 'public'
            ? 'Set a sale price. The name will be publicly listed in the marketplace for anyone to buy.'
            : 'Only the address below will be able to claim this name — it stays out of the public marketplace.'}
        </Typography>

        {err && <Alert severity="error" sx={{ fontSize: '0.78rem', py: 0 }}>{err}</Alert>}

        {mode === 'private' && (
          <TextField
            autoFocus size="small" fullWidth placeholder="Recipient address…"
            value={recipient} onChange={e => setRecipient(e.target.value)}
            error={recipient.length > 0 && !recipientValid}
            helperText={recipient.length > 0 && !recipientValid ? 'Enter a valid address' : ' '}
            sx={{ ...fieldSx, '& .MuiFormHelperText-root': { fontSize: '0.68rem', mx: 0 } }}
          />
        )}

        {mode === 'private' && (
          <FormControlLabel
            sx={{ ml: 0, gap: 1 }}
            control={
              <Checkbox
                size="small" checked={isGift} onChange={e => setIsGift(e.target.checked)}
                icon={<CardGiftcardIcon sx={{ fontSize: '1.1rem', color: c.textSecondary }} />}
                checkedIcon={<CardGiftcardIcon sx={{ fontSize: '1.1rem', color: c.accent }} />}
                sx={{ p: 0 }}
              />
            }
            label={<Typography sx={{ fontSize: '0.8rem', color: c.textPrimary }}>Make this a free gift</Typography>}
          />
        )}

        {!(mode === 'private' && isGift) && (
          <TextField
            autoFocus={mode === 'public'} size="small" fullWidth placeholder="Price in QORT…"
            value={price} onChange={e => setPrice(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void confirm()}
            type="number" slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            sx={fieldSx}
          />
        )}

        <Button
          variant="contained" disableElevation onClick={() => { void confirm(); }} disabled={busy || !valid}
          sx={{ bgcolor: c.accent, color: c.accentText, borderRadius: 0, '&:hover': { bgcolor: c.accentHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.accent, color: c.accentText } }}
        >
          {busy ? <CircularProgress size={14} sx={{ color: c.accentText }} /> : buttonLabel}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({ name, onClose, onSuccess }: { name: string; onClose: () => void; onSuccess: () => void }) {
  const c = useColors();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    if (!newName.trim()) return;
    setBusy(true); setErr(null);
    try {
      if (!await ensureAccountUnlocked()) return;
      await updateName(name, newName.trim()); onSuccess(); onClose();
    }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: c.surface, border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: 0 } }}>
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: `${tokens.shape.borderWidth} solid ${c.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
        Rename "{name}"
        <IconButton size="small" onClick={onClose} sx={{ color: c.textSecondary }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, bgcolor: `${c.error}18`, border: `1px solid ${c.error}55`, borderRadius: `${tokens.shape.radius}px`, p: 1.5 }}>
          <WarningAmberIcon sx={{ fontSize: '0.9rem', color: c.error, mt: '1px', flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.75rem', color: c.error, lineHeight: 1.5 }}>
            This permanently renames <strong>{name}</strong>. The old name is released and cannot be reclaimed.
          </Typography>
        </Box>
        {err && <Alert severity="error" sx={{ fontSize: '0.78rem', py: 0 }}>{err}</Alert>}
        <TextField
          autoFocus size="small" fullWidth placeholder="New name…"
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void confirm()}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', '& fieldset': { borderColor: `${c.error}55` }, '&:hover fieldset': { borderColor: c.error }, '&.Mui-focused fieldset': { borderColor: c.error } }, '& input::placeholder': { color: c.error, opacity: 0.5 } }}
        />
        <Button
          variant="contained" disableElevation onClick={() => { void confirm(); }} disabled={busy || !newName.trim()}
          sx={{ bgcolor: c.error, color: c.surface, borderRadius: 0, '&:hover': { bgcolor: c.dangerSoft }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.error, color: c.surface } }}
        >
          {busy ? <CircularProgress size={14} sx={{ color: c.surface }} /> : 'Rename permanently'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ActionBtn({ children, onClick, disabled, color = 'accent', loading = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; color?: 'accent' | 'error'; loading?: boolean }) {
  const c = useColors();
  const bg = color === 'error' ? c.error : c.accent;
  const bgHover = color === 'error' ? c.dangerSoft : c.accentHover;
  const fg = color === 'error' ? c.surface : c.accentText;
  return (
    <Button variant="contained" disableElevation size="small" disabled={disabled || loading} onClick={onClick}
      sx={{ bgcolor: bg, color: fg, borderRadius: '50px', fontSize: '0.72rem', px: 1.75, whiteSpace: 'nowrap', '&:hover': { bgcolor: bgHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: bg, color: fg } }}>
      {loading ? <CircularProgress size={11} sx={{ color: fg }} /> : children}
    </Button>
  );
}

function OutlineBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  const c = useColors();
  return (
    <Button variant="outlined" size="small" disabled={disabled} onClick={onClick}
      sx={{ borderColor: c.accent, color: c.accent, borderRadius: '50px', fontSize: '0.72rem', px: 1.75, whiteSpace: 'nowrap', '&:hover': { bgcolor: c.borderLight }, '&.Mui-disabled': { opacity: 0.35 } }}>
      {children}
    </Button>
  );
}

function MyNameCard({ entry, isPrimary, onRefresh }: { entry: NameEntry; isPrimary: boolean; onRefresh: () => void }) {
  const c = useColors();
  const [sellOpen, setSellOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function handleCancel() {
    setCancelBusy(true); setStatus(null);
    try {
      if (!await ensureAccountUnlocked()) return;
      await cancelSellName(entry.name);
      setStatus({ type: 'success', msg: 'Listing cancelled.' });
      onRefresh();
    } catch (e) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : String(e) });
    } finally { setCancelBusy(false); }
  }

  const listed = entry.isForSale === true;
  const isPrivate = listed && !!entry.saleRecipient;
  const isGift = isPrivate && !entry.salePrice;
  const statusColor = isPrivate ? c.accent : c.success;

  return (
    <Box sx={{
      border: `${tokens.shape.borderWidth} solid ${listed ? `${statusColor}66` : c.borderLight}`,
      borderRadius: `${tokens.shape.radius}px`,
      bgcolor: listed ? `${statusColor}08` : c.surface,
      p: 2.5,
      transition: '0.15s ease',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: listed ? 1 : 1.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>{entry.name}</Typography>
        {isPrimary && <Chip label="Primary" size="small" sx={{ fontSize: '0.62rem', height: 18, bgcolor: `${c.accent}22`, color: c.accent, border: `1px solid ${c.accent}44` }} />}
      </Box>

      {listed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: `${statusColor}14`, border: `1px solid ${statusColor}33`, borderRadius: `${tokens.shape.radius / 2}px`, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: tokens.typography.weightBold, letterSpacing: '0.1em', textTransform: 'uppercase', color: statusColor }}>
            {isPrivate ? (isGift ? 'Gift Sent' : 'Private Sale') : 'For Sale'}
          </Typography>
          {!isGift && (
            <Typography sx={{ fontSize: '0.9rem', fontWeight: tokens.typography.weightBlack, color: statusColor, letterSpacing: '-0.01em' }}>
              {entry.salePrice?.toLocaleString() ?? '?'} QORT
            </Typography>
          )}
          {isPrivate && (
            <Typography sx={{ fontSize: '0.7rem', color: c.textSecondary, fontFamily: 'monospace' }}>
              → {truncateAddress(entry.saleRecipient!)}
            </Typography>
          )}
        </Box>
      )}

      {status && <Alert severity={status.type} sx={{ mb: 1.5, fontSize: '0.75rem', py: 0 }}>{status.msg}</Alert>}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {listed ? (
          <ActionBtn color="error" onClick={() => { void handleCancel(); }} loading={cancelBusy}>Cancel listing</ActionBtn>
        ) : (
          <ActionBtn onClick={() => setSellOpen(true)}>Sell</ActionBtn>
        )}
        <OutlineBtn onClick={() => setRenameOpen(true)}>Rename</OutlineBtn>
      </Box>

      {sellOpen && <SellDialog name={entry.name} onClose={() => setSellOpen(false)} onSuccess={onRefresh} />}
      {renameOpen && <RenameDialog name={entry.name} onClose={() => setRenameOpen(false)} onSuccess={onRefresh} />}
    </Box>
  );
}

export function MyNamesPage() {
  const c = useColors();
  const account = useAtomValue(accountAtom);
  const uiStyle = useAtomValue(uiStyleAtom);
  const isClassic = uiStyle === 'classic';
  const [names, setNames] = useState<NameEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [registerInput, setRegisterInput] = useState('');
  const [busyRegister, setBusyRegister] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<Status>(null);

  const load = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setNames(await getAccountNames(account.address));
    setLoading(false);
  }, [account]);

  useEffect(() => { void load(); }, [load]);

  async function handleRegister() {
    const name = registerInput.trim();
    if (!name) return;
    setBusyRegister(true); setRegisterStatus(null);
    try {
      if (!await ensureAccountUnlocked()) return;
      await registerName(name);
      setRegisterStatus({ type: 'success', msg: `"${name}" registered.` });
      setRegisterInput('');
      void load();
    } catch (e) {
      setRegisterStatus({ type: 'error', msg: e instanceof Error ? e.message : String(e) });
    } finally { setBusyRegister(false); }
  }

  return (
    <Box
      sx={{
        pt: isClassic
          ? `calc(var(--names-top-bar-height, ${tokens.spacing.classicTopBarOffset}px) + 24px)`
          : `${tokens.spacing.topBarHeight + 24}px`,
        pb: 4,
        px: { xs: isClassic ? 1.5 : 2, md: isClassic ? 3 : 4 },
        maxWidth: isClassic ? c.layoutMaxWidth : 720,
        mx: 'auto',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <BadgeIcon sx={{ fontSize: '1rem', color: c.textSecondary }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: tokens.typography.weightBold, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textSecondary }}>
            My Names
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '1.1rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>Manage your names</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: c.accent }} /></Box>
      ) : (
        <>
          {names.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <MyNameCard entry={names[0]} isPrimary onRefresh={load} />
            </Box>
          )}
          {names.length === 0 && (
            <Typography sx={{ fontSize: '0.85rem', color: c.textSecondary, mb: 1.5 }}>You have no registered names yet.</Typography>
          )}
        </>
      )}

      <Box sx={{ border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: `${tokens.shape.radius}px`, bgcolor: c.surface, p: 3, mb: names.length > 1 ? 1.5 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AddIcon sx={{ fontSize: '1rem', color: c.textSecondary }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: tokens.typography.weightBold, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textSecondary }}>
            Register New Name
          </Typography>
        </Box>
        {registerStatus && <Alert severity={registerStatus.type} sx={{ mb: 1.5, fontSize: '0.78rem', py: 0 }}>{registerStatus.msg}</Alert>}
        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            size="small" fullWidth placeholder="Choose a name…"
            value={registerInput} onChange={e => setRegisterInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void handleRegister()}
            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', '& fieldset': { borderColor: c.borderLight }, '&:hover fieldset': { borderColor: c.accent }, '&.Mui-focused fieldset': { borderColor: c.accent } } }}
          />
          <Button
            variant="contained" disableElevation disabled={busyRegister || !registerInput.trim()}
            onClick={() => { void handleRegister(); }}
            sx={{ bgcolor: c.accent, color: c.accentText, borderRadius: '50px', px: 2.5, fontSize: '0.75rem', whiteSpace: 'nowrap', '&:hover': { bgcolor: c.accentHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.accent, color: c.accentText }, width: { xs: '100%', sm: 'auto' } }}
          >
            {busyRegister ? <CircularProgress size={14} sx={{ color: c.accentText }} /> : 'Register'}
          </Button>
        </Box>
      </Box>

      {!loading && names.length > 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {names.slice(1).map(n => (
            <MyNameCard key={n.name} entry={n} isPrimary={false} onRefresh={load} />
          ))}
        </Box>
      )}
    </Box>
  );
}
