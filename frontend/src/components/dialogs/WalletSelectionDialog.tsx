import { Button, Dialog, Stack, Typography, Box, Link } from "@mui/material";
import { openWalletConnectModal } from "../../services/wallets/walletconnect/walletConnectClient";
import WalletConnectLogo from "../../assets/walletconnect-logo.svg";

interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: (value: string) => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  return (
    <Dialog onClose={onClose} open={open} maxWidth="sm" fullWidth sx={{
      '& .MuiDialog-paper': {
        borderRadius: '16px',
        padding: '24px',
        backgroundColor: 'var(--bg-primary)'
      }
    }}>
      <Stack p={3} gap={2} sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Connect Your Wallet
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          To get started, you'll need a Hashpack wallet
        </Typography>

        <Box sx={{ bgcolor: 'var(--bg-surface-2)', p: 2, borderRadius: 2, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" mb={1}>
            Don't have Hashpack yet?
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            1. Download Hashpack from{' '}
            <Link 
              href="https://www.hashpack.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              color="primary"
            >
              hashpack.app
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            2. Create your new wallet or import an existing one
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={() => {
            openWalletConnectModal();
            setOpen(false);
          }}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          <img
            src={WalletConnectLogo}
            alt="WalletConnect logo"
            style={{
              width: '24px',
              height: '24px',
              marginRight: '12px'
            }}
          />
          Connect with Hashpack
        </Button>

        <Typography variant="caption" color="text.secondary" mt={1}>
          Hashpack connects securely through WalletConnect protocol
        </Typography>
      </Stack>
    </Dialog>
  );
}
