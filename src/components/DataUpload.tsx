import React, { useCallback, useState } from 'react';
import { Box, Typography, Button, Paper, Chip, Stack } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { CloudUpload as CloudUploadIcon, AccountBalance as BankIcon, Description as CsvIcon, Image as ImageIcon, Description } from '@mui/icons-material';

interface DataUploadProps {
    onUpload: (file: File) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onUpload }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
        },
        maxFiles: 1,
    });

    const handleUploadClick = () => {
        if (file) {
            onUpload(file);
        }
    };

    const getBorderColor = () => {
        if (isDragAccept) return 'primary.main';
        if (isDragReject) return 'error.main';
        if (isDragActive) return 'primary.light';
        return 'grey.500';
    };

    const getFileIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return <BankIcon sx={{ mr: 1 }} />;
            case 'csv':
                return <CsvIcon sx={{ mr: 1 }} />;
            case 'png':
            case 'jpg':
            case 'jpeg':
                return <ImageIcon sx={{ mr: 1 }} />;
            default:
                return <Description sx={{ mr: 1 }} />;
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
                {t('data_upload.title')}
            </Typography>
            
            <Paper
                {...getRootProps()}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: getBorderColor(),
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    transition: 'border .24s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: 'primary.main',
                    },
                }}
            >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                <Typography variant="h6" gutterBottom>
                    {t('data_upload.drop_files_here')}
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                    {t('data_upload.or_click_to_select')}
                </Typography>
                
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    <Chip 
                        icon={<BankIcon />} 
                        label="PDF выписки банков" 
                        variant="outlined" 
                        size="small"
                        color="primary"
                    />
                    <Chip 
                        icon={<CsvIcon />} 
                        label="CSV файлы" 
                        variant="outlined" 
                        size="small"
                    />
                    <Chip 
                        icon={<ImageIcon />} 
                        label="Изображения" 
                        variant="outlined" 
                        size="small"
                    />
                </Stack>
                
                <Typography variant="body2" color="textSecondary">
                    Поддерживаются банки: <strong>Каспи</strong>, <strong>Халык</strong> и другие
                </Typography>
                
                {file && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0, 150, 136, 0.1)', borderRadius: 1 }}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} color="textPrimary">
                            {getFileIcon(file.name)}
                            <strong>{file.name}</strong>
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Размер: {(file.size / 1024 / 1024).toFixed(2)} МБ
                        </Typography>
                    </Box>
                )}
            </Paper>
            
            <Button
                variant="contained"
                color="primary"
                onClick={handleUploadClick}
                disabled={!file}
                fullWidth
                sx={{ mt: 3, py: 1.5 }}
            >
                {t('data_upload.upload_and_analyze')}
            </Button>
            
            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" align="center">
                    💡 <strong>Совет:</strong> Для лучших результатов используйте PDF выписки напрямую из интернет-банкинга
                </Typography>
            </Box>
        </Box>
    );
};

export default DataUpload;