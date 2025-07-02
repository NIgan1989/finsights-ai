import React, { useCallback, useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

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

    const getFileTypeText = () => {
        if (file) {
            if (file.type === 'application/pdf') {
                return 'PDF банковская выписка';
            } else if (file.type === 'text/csv') {
                return 'CSV файл';
            }
            return file.type;
        }
        return null;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 500, margin: 'auto' }}>
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
                <Typography color="textSecondary" sx={{ mb: 1 }}>
                    {t('data_upload.or_click_to_select')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Поддерживаемые форматы: CSV файлы и PDF выписки банков Каспи, Халык
                </Typography>
                {file && (
                    <Box sx={{ mt: 2 }}>
                        <Typography color="textPrimary">
                            {t('data_upload.selected_file')}: {file.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Тип: {getFileTypeText()}
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
        </Box>
    );
};

export default DataUpload;