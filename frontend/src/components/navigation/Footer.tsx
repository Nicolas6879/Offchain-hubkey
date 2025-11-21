import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white'
      }}
    >
      <Typography variant="body2">
        © {new Date().getFullYear()} Offchain Hubs
      </Typography>
    </Box>
  );
};

export default Footer;