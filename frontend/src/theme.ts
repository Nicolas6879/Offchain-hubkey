import { createTheme } from "@mui/material";

export const theme = createTheme({
  typography: {
    fontFamily: '"Styrene A Web", "Helvetica Neue", Sans-Serif',
  },
  palette: {
    mode: 'dark',
    primary: {
      main: 'hsl(14, 100%, 57%)', // Usar a cor primária das variáveis CSS
      light: 'hsl(14, 100%, 67%)',
      dark: 'hsl(14, 100%, 47%)',
    }
  },
  components: {
    // Sobrescrever estilos para usar variáveis CSS
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }
      }
    }
  }
});