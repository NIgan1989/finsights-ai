import React, { ReactNode, useState } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    IconButton, 
    Menu, 
    MenuItem, 
    Typography,
    Box,
    Tooltip,
    Skeleton,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    useTheme,
    alpha
} from '@mui/material';
import { 
    MoreVert, 
    Fullscreen, 
    GetApp, 
    Refresh,
    Close
} from '@mui/icons-material';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    loading?: boolean;
    onRefresh?: () => void;
    onExport?: () => void;
    height?: number | string;
    actions?: ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
    title, 
    subtitle,
    children, 
    loading = false,
    onRefresh,
    onExport,
    height = 400,
    actions
}) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleFullscreen = () => {
        setFullscreenOpen(true);
        handleMenuClose();
    };

    const handleRefresh = () => {
        onRefresh?.();
        handleMenuClose();
    };

    const handleExport = () => {
        onExport?.();
        handleMenuClose();
    };

    const cardContent = (
        <CardContent sx={{ p: 3, height: height, display: 'flex', flexDirection: 'column' }}>
            {loading ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Skeleton variant="text" width="60%" height={30} />
                    <Skeleton variant="rectangular" width="100%" sx={{ flex: 1, borderRadius: 2 }} />
                </Box>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {children}
                </Box>
            )}
        </CardContent>
    );

    return (
        <>
            <Card
                sx={{
                    height: '100%',
                    background: theme.palette.mode === 'dark' 
                        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        opacity: 0.8,
                    }
                }}
            >
                <CardHeader
                    title={
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                    }
                    subheader={subtitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    )}
                    action={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {actions}
                            <Tooltip title="Опции">
                                <IconButton onClick={handleMenuClick} size="small">
                                    <MoreVert />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    }
                    sx={{ pb: 1 }}
                />
                {cardContent}
                
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={handleFullscreen}>
                        <Fullscreen sx={{ mr: 2 }} />
                        Полноэкранный режим
                    </MenuItem>
                    {onRefresh && (
                        <MenuItem onClick={handleRefresh}>
                            <Refresh sx={{ mr: 2 }} />
                            Обновить данные
                        </MenuItem>
                    )}
                    {onExport && (
                        <MenuItem onClick={handleExport}>
                            <GetApp sx={{ mr: 2 }} />
                            Экспорт данных
                        </MenuItem>
                    )}
                </Menu>
            </Card>

            {/* Fullscreen Dialog */}
            <Dialog
                open={fullscreenOpen}
                onClose={() => setFullscreenOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '80vh',
                        background: theme.palette.mode === 'dark' 
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
                            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
                }}>
                    <Box>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => setFullscreenOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3, flex: 1 }}>
                    <Box sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
                        {children}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
                    {onExport && (
                        <Button 
                            variant="outlined" 
                            startIcon={<GetApp />} 
                            onClick={handleExport}
                        >
                            Экспорт
                        </Button>
                    )}
                    <Button 
                        variant="contained" 
                        onClick={() => setFullscreenOpen(false)}
                    >
                        Закрыть
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ChartCard;