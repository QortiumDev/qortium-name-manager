import { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, TextField, Typography, Alert, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import BadgeIcon from '@mui/icons-material/Badge';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAtomValue } from 'jotai';
import { useColors } from '../theme/ColorTokensContext';
import { tokens } from '../theme/tokens';
import { accountAtom } from '../state/atoms';
import { getAccountNames, registerName, updateName, sellName, cancelSellName } from '../api/qortal';

type NameEntry = { name: string; owner: string; description?: string; registrationTimestamp: number; isForSale?: boolean; salePrice?: number };
type Status = { type: 'success' | 'error'; msg: string } | null;

function SellDialog({ name, onClose, onSuccess }: { name: string; onClose: () => void; onSuccess: () => void }) {
  const c = useColors();
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = parseFloat(price);
  const valid = !isNaN(parsed) && parsed > 0;

  async function confirm() {
    if (!valid) return;
    setBusy(true); setErr(null);
    try { await sellName(name, parsed); onSuccess(); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: c.surface, border: `${tokens.shape.borderWidth} solid ${c.borderLight}`, borderRadius: 0 } }}>
      <DialogTitle sx={{ px: 3, py: 2, borderBottom: `${tokens.shape.borderWidth} solid ${c.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>
        Sell "{name}"
        <IconButton size="small" onClick={onClose} sx={{ color: c.textSecondary }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ fontSize: '0.82rem', color: c.textSecondary }}>
          Set a sale price. The name will be publicly listed in the marketplace.
        </Typography>
        {err && <Alert severity="error" sx={{ fontSize: '0.78rem', py: 0 }}>{err}</Alert>}
        <TextField
          autoFocus size="small" fullWidth placeholder="Price in QORT…"
          value={price} onChange={e => setPrice(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void confirm()}
          type="number" slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', '& fieldset': { borderColor: c.borderLight }, '&:hover fieldset': { borderColor: c.accent }, '&.Mui-focused fieldset': { borderColor: c.accent } } }}
        />
        <Button
          variant="contained" disableElevation onClick={() => { void confirm(); }} disabled={busy || !valid}
          sx={{ bgcolor: c.accent, color: c.accentText, borderRadius: 0, '&:hover': { bgcolor: c.accentHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.accent, color: c.accentText } }}
        >
          {busy ? <CircularProgress size={14} sx={{ color: c.accentText }} /> : `List for ${valid ? parsed.toLocaleString() : '?'} QORT`}
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
    try { await updateName(name, newName.trim()); onSuccess(); onClose(); }
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
          sx={{ bgcolor: c.error, color: '#fff', borderRadius: 0, '&:hover': { bgcolor: '#c0392b' }, '&.Mui-disabled': { opacity: 0.35, bgcolor: c.error, color: '#fff' } }}
        >
          {busy ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Rename permanently'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ActionBtn({ children, onClick, disabled, color = 'accent', loading = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; color?: 'accent' | 'error'; loading?: boolean }) {
  const c = useColors();
  const bg = color === 'error' ? c.error : c.accent;
  const bgHover = color === 'error' ? '#c0392b' : c.accentHover;
  return (
    <Button variant="contained" disableElevation size="small" disabled={disabled || loading} onClick={onClick}
      sx={{ bgcolor: bg, color: '#fff', borderRadius: '50px', fontSize: '0.72rem', px: 1.75, whiteSpace: 'nowrap', '&:hover': { bgcolor: bgHover }, '&.Mui-disabled': { opacity: 0.35, bgcolor: bg, color: '#fff' } }}>
      {loading ? <CircularProgress size={11} sx={{ color: '#fff' }} /> : children}
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
      await cancelSellName(entry.name);
      setStatus({ type: 'success', msg: 'Listing cancelled.' });
      onRefresh();
    } catch (e) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : String(e) });
    } finally { setCancelBusy(false); }
  }

  const listed = entry.isForSale === true;

  return (
    <Box sx={{
      border: `${tokens.shape.borderWidth} solid ${listed ? `${c.success}66` : c.borderLight}`,
      borderRadius: `${tokens.shape.radius}px`,
      bgcolor: listed ? `${c.success}08` : c.surface,
      p: 2.5,
      transition: '0.15s ease',
    }}>
      {/* Name + badges row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: listed ? 1 : 1.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: tokens.typography.weightBold, color: c.textPrimary }}>{entry.name}</Typography>
        {isPrimary && <Chip label="Primary" size="small" sx={{ fontSize: '0.62rem', height: 18, bgcolor: `${c.accent}22`, color: c.accent, border: `1px solid ${c.accent}44` }} />}
      </Box>

      {/* Listed-for-sale price banner */}
      {listed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: `${c.success}14`, border: `1px solid ${c.success}33`, borderRadius: `${tokens.shape.radius / 2}px` }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: tokens.typography.weightBold, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.success }}>
            For Sale
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: tokens.typography.weightBlack, color: c.success, letterSpacing: '-0.01em' }}>
            {entry.salePrice?.toLocaleString() ?? '?'} QORT
          </Typography>
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
  const [names, setNames] = useState<NameEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
      await registerName(name);
      setRegisterStatus({ type: 'success', msg: `"${name}" registered.` });
      setRegisterInput('');
      void load();
    } catch (e) {
      setRegisterStatus({ type: 'error', msg: e instanceof Error ? e.message : String(e) });
    } finally { setBusyRegister(false); }
  }

  if (!account) return null;

  return (
    <Box sx={{ pt: `${tokens.spacing.topBarHeight + 24}px`, pb: 4, px: { xs: 2, md: 4 }, maxWidth: 720, mx: 'auto' }}>
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
          {/* Primary name */}
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

      {/* Register — sits between primary name and the rest */}
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

      {/* Remaining names */}
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
