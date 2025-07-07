import React, { useCallback, useState } from 'react';
import {
    Box, Typography, Button, Paper, Chip, Stack, LinearProgress, Alert,
    Accordion, AccordionSummary, AccordionDetails, IconButton
} from '@mui/material';
import {
    useDropzone
} from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import {
    CloudUpload as CloudUploadIcon,
    AccountBalance as BankIcon,
    Description as CsvIcon,
    Image as ImageIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

interface DataUploadProps {
    onUpload: (file: File) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onUpload }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'bank' | 'csv' | 'image' | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const newFile = acceptedFiles[0];
            setFile(newFile);

            // Определяем тип файла для отображения информации
            if (newFile.type === 'application/pdf') {
                setFileType('bank');
            } else if (newFile.type === 'text/csv') {
                setFileType('csv');
            } else if (['image/png', 'image/jpeg'].includes(newFile.type)) {
                setFileType('image');
            } else {
                setFileType(null);
            }
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
                return <CsvIcon sx={{ mr: 1 }} />;
        }
    };

    // Специфичные подсказки в зависимости от типа файла
    const renderFileTypeHint = () => {
        if (!file) return null;

        switch (fileType) {
            case 'bank':
                return (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Распознаны данные PDF-выписки. Поддерживаются: <strong>Kaspi Bank</strong>, <strong>Halyk Bank</strong>.
                            Файл будет проанализирован автоматически.
                        </Typography>
                    </Alert>
                );
            case 'csv':
                return (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            CSV-файл должен содержать колонки: <strong>Дата</strong>, <strong>Описание</strong> и <strong>Сумма</strong>.
                        </Typography>
                    </Alert>
                );
            case 'image':
                return (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            Изображения анализируются с помощью ИИ для извлечения транзакций.
                            Для лучших результатов убедитесь, что текст транзакций хорошо виден.
                        </Typography>
                    </Alert>
                );
            default:
                return null;
        }
    };

    const handleClearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setFileType(null);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3 }}>
                {t('upload_transactions')}
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

                {!file ? (
                    <>
                        <CloudUploadIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                        <Typography variant="h6" gutterBottom>
                            {t('data_upload.drop_files_here')}
                        </Typography>
                        <Typography color="textSecondary" sx={{ mb: 2 }}>
                            {t('data_upload.or_click_to_select')}
                        </Typography>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                        <Typography variant="h6">{t('data_upload.selected_file')}</Typography>
                    </Box>
                )}

                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                    <Chip
                        icon={<BankIcon />}
                        label="PDF выписки банков"
                        variant={fileType === 'bank' ? 'filled' : 'outlined'}
                        size="small"
                        color={fileType === 'bank' ? 'primary' : 'default'}
                    />
                    <Chip
                        icon={<CsvIcon />}
                        label="CSV файлы"
                        variant={fileType === 'csv' ? 'filled' : 'outlined'}
                        size="small"
                        color={fileType === 'csv' ? 'primary' : 'default'}
                    />
                    <Chip
                        icon={<ImageIcon />}
                        label="Изображения"
                        variant={fileType === 'image' ? 'filled' : 'outlined'}
                        size="small"
                        color={fileType === 'image' ? 'primary' : 'default'}
                    />
                </Stack>

                {!file && (
                    <Typography variant="body2" color="textSecondary">
                        Поддерживаются банки: <strong>Каспи</strong>, <strong>Халык</strong> и другие
                    </Typography>
                )}

                {file && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(0, 150, 136, 0.1)', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }} color="textPrimary">
                                {getFileIcon(file.name)}
                                <strong>{file.name}</strong>
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={handleClearFile}
                                sx={{ ml: 1 }}
                                aria-label="Удалить файл"
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Размер: {(file.size / 1024 / 1024).toFixed(2)} МБ
                        </Typography>
                    </Box>
                )}
            </Paper>

            {renderFileTypeHint()}

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

            <Accordion sx={{ mt: 3 }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="supported-file-formats"
                    id="supported-file-formats-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InfoIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                        <Typography>Подробнее о поддерживаемых форматах</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="subtitle2" gutterBottom color="primary">
                        Банковские выписки (PDF)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Поддерживаются официальные выписки из Kaspi Bank и Halyk Bank в формате PDF.
                        Выписки анализируются автоматически, извлекая данные о транзакциях.
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom color="primary">
                        CSV файлы
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Файлы должны содержать колонки "Дата", "Описание" и "Сумма".
                        Даты могут быть в формате ДД.ММ.ГГГГ или ГГГГ-ММ-ДД.
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom color="primary">
                        Изображения (PNG, JPEG)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Изображения выписок или таблиц с транзакциями. ИИ извлекает текст и данные,
                        но качество распознавания зависит от четкости изображения.
                    </Typography>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default DataUpload;