import { createTheme } from '@mui/material/styles';

// Define the light theme
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f4f6f8',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h5: {
            fontWeight: 600,
        },
    },
});

// Define the dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00BFFF', // DeepSkyBlue
        },
        secondary: {
            main: '#FF69B4', // HotPink
        },
        background: {
            default: '#1a1a1a',
            paper: '#2c2c2c',
        },
        text: {
            primary: '#e0e0e0',
            secondary: '#a0a0a0',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h5: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        }
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    background: 'rgba(44, 44, 44, 0.75)'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(30, 30, 30, 0.8)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
                }
            }
        }
    }
});

export { darkTheme }; 