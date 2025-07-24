import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0288d1', // Lighter blue for modern look
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#d81b60', // Vibrant pink for accents
    },
    background: {
      default: '#e3f2fd', // Soft blue background
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#0288d1',
      marginBottom: '24px',
    },
    body1: {
      fontSize: '1rem',
      color: '#212121',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          padding: '10px 20px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0288d1',
          '&:hover': {
            backgroundColor: '#0277bd',
          },
        },
        outlined: {
          borderColor: '#0288d1',
          color: '#0288d1',
          '&:hover': {
            backgroundColor: 'rgba(2, 136, 209, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#f5f5f5',
            '&:hover fieldset': {
              borderColor: '#0288d1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0288d1',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#f5f5f5',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 12px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#0288d1',
          color: '#ffffff',
          fontWeight: 700,
          padding: '12px',
        },
        body: {
          backgroundColor: '#ffffff',
          borderBottom: 'none',
          padding: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            backgroundColor: 'rgba(2, 136, 209, 0.04)',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: '#f9fafb',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          paddingTop: '16px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '0 24px 24px 0',
          margin: '4px 8px',
          padding: '12px 16px',
          '&:hover': {
            backgroundColor: 'rgba(2, 136, 209, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(2, 136, 209, 0.2)',
            color: '#0288d1',
            '& .MuiListItemIcon-root': {
              color: '#0288d1',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '24px',
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

export default theme;