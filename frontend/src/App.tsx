import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { Navbar } from "./components";
import { Box, ThemeProvider } from "@mui/material";
import { BrowserRouter as Router } from "react-router-dom";
import { AllWalletsProvider } from "./services/wallets/AllWalletsProvider";
import { AdminProvider } from "./contexts/AdminContext";
import { theme } from "./theme";
import { initializeTheme } from "./utils/themeUtils";
import AppRouter from "./AppRouter";
import "./App.css";
import "./styles/themes.css";

function App() {
  // Inicializa o tema ao carregar a aplicação
  React.useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AllWalletsProvider>
        <AdminProvider>
          <Router>
            <CssBaseline />
            <Box
              className="theme-transition"
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <header>
                <Navbar />
              </header>
              <Box flex={1} p={3}>
                <AppRouter />
              </Box>
            </Box>
          </Router>
        </AdminProvider>
      </AllWalletsProvider>
    </ThemeProvider>
  );
}

export default App;
