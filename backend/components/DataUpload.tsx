
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';

interface DataUploadProps {
    onFileUploaded: (file: File) => void;
    isProcessing: boolean;
    isCompact?: boolean;
}

const DataUpload: React.FC<DataUploadProps> = ({ onFileUploaded, isProcessing, isCompact = false }) => {
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { userId, email } = useUser();

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);
        if (rejectedFiles && rejectedFiles.length > 0) {
            setError('Неверный тип файла. Пожалуйста, загрузите файл в формате CSV, PDF, PNG или JPG.');
            return;
        }

        const file = acceptedFiles[0];
        if (file) {
            setSelectedFile(file);
        }
    }, []);

    const handleUpload = async () => {
        if (!selectedFile) return;

        // Проверяем авторизацию пользователя
        const currentUserId = userId ?? email;
        if (!currentUserId) {
            subscriptionService.showUpgradeModal('Войдите в систему, чтобы загружать файлы');
            return;
        }

        // Проверяем лимит загрузки файлов
        const limitCheck = subscriptionService.checkFileUploadLimit();
        if (!limitCheck.allowed) {
            subscriptionService.showUpgradeModal(limitCheck.reason || 'Лимит загрузки файлов достигнут');
            return;
        }

        // Инкрементируем счетчик загрузок файлов
        await subscriptionService.incrementFileUploads(currentUserId);

        // Передаем файл для обработки
        onFileUploaded(selectedFile);
        setSelectedFile(null);
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setError(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
        },
        multiple: false,
        disabled: isProcessing || !!selectedFile,
    });

    const getFileIcon = (fileName: string) => {
        const extension = fileName.toLowerCase().split('.').pop();
        switch (extension) {
            case 'pdf':
                return (
                    <svg className="w-12 h-12 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                );
            case 'csv':
                return (
                    <svg className="w-12 h-12 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'png':
            case 'jpg':
            case 'jpeg':
                return (
                    <svg className="w-12 h-12 text-info" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-12 h-12 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className={isCompact ? "p-6" : "min-h-screen bg-gradient-upload-background relative overflow-hidden"}>
            {/* Background decorative elements */}
            {!isCompact && <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>}

            <div className={isCompact ? "" : "relative z-10 flex flex-col items-center justify-center min-h-screen p-6"}>
                <div className="text-center max-w-4xl w-full">
                    {/* Header Section */}
                    {!isCompact && <div className="mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                            Добро пожаловать в FinSights AI
                        </h1>
                        <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-loose font-medium">
                            Ваш персональный финансовый ассистент с искусственным интеллектом. 
                            Начните с загрузки банковской выписки и получите детальный анализ ваших финансов.
                        </p>
                    </div>}

                    {/* Upload Section */}
                    {!selectedFile ? (
                        <div className="bg-surface rounded-3xl p-8 shadow-2xl border border-border mb-8 transition-all duration-500 hover:shadow-3xl">
                            <div
                                {...getRootProps()}
                                className={`relative p-12 border-2 border-dashed rounded-2xl transition-all duration-500 transform ${
                                    isProcessing 
                                        ? 'cursor-wait bg-muted border-border' 
                                        : 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02]'
                                } ${
                                    isDragActive 
                                        ? 'border-info bg-gradient-upload-drag-active scale-105 shadow-lg' 
                                        : 'border-border hover:border-info hover:bg-gradient-upload-drag-hover'
                                }`}
                            >
                                <input {...getInputProps()} />
                                
                                <div className="flex flex-col items-center">
                                    {isProcessing ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-gradient-upload-processing rounded-3xl flex items-center justify-center mb-6 shadow-lg animate-pulse">
                                                <svg className="animate-spin w-10 h-10 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                            <p className="text-3xl font-bold text-foreground mb-3">Обработка файла...</p>
                                            <p className="text-lg text-muted-foreground animate-pulse font-medium">Наш ИИ анализирует ваши данные</p>
                                            <div className="flex gap-1 mt-4">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    ) : isDragActive ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-gradient-upload-drop rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-xl">
                                                <svg className="w-10 h-10 text-primary-foreground animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-3xl font-bold text-foreground mb-3 animate-pulse">Отпустите файл для загрузки</p>
                                            <p className="text-lg text-foreground font-medium">Мы готовы обработать ваш документ</p>
                                            <div className="flex gap-2 mt-4">
                                                <div className="w-3 h-3 bg-success rounded-full animate-ping"></div>
                                                <div className="w-3 h-3 bg-success/80 rounded-full animate-ping delay-75"></div>
                                                <div className="w-3 h-3 bg-success/60 rounded-full animate-ping delay-150"></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-gradient-upload-default rounded-3xl flex items-center justify-center mb-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                                                <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12" />
                                                </svg>
                                            </div>
                                            <p className="text-3xl font-bold text-foreground mb-3">Перетащите файл сюда</p>
                                            <p className="text-lg text-muted-foreground mb-8 font-medium">или нажмите для выбора с компьютера</p>
                                            
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="text-base text-muted-foreground font-semibold">Поддерживаются:</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-2 bg-gradient-upload-file-pdf text-destructive rounded-xl font-medium shadow-sm border border-destructive/20 hover:shadow-md transition-all duration-200">📄 PDF</span>
                                                    <span className="px-3 py-2 bg-gradient-upload-file-csv text-success rounded-xl font-medium shadow-sm border border-success/20 hover:shadow-md transition-all duration-200">📊 CSV</span>
                                                    <span className="px-3 py-2 bg-gradient-upload-file-image text-info rounded-xl font-medium shadow-sm border border-info/20 hover:shadow-md transition-all duration-200">🖼️ PNG/JPG</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-surface rounded-3xl p-8 shadow-2xl border border-border mb-8 transition-all duration-500">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-6 mb-8 p-6 bg-gradient-upload-selected rounded-2xl border border-border shadow-sm">
                                    <div className="transform hover:scale-110 transition-transform duration-300">
                                        {getFileIcon(selectedFile.name)}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-2xl font-bold text-foreground mb-2">Файл выбран</p>
                                        <p className="text-muted-foreground text-lg font-semibold mb-2">{selectedFile.name}</p>
            <p className="text-muted-foreground text-base font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button 
                                        className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
                                        onClick={handleUpload} 
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? '🔄 Загрузка...' : '🚀 Загрузить и анализировать'}
                                    </button>
                                    <button 
                                        className="px-6 py-4 bg-background border-2 border-border text-foreground rounded-2xl font-semibold hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md" 
                                        onClick={handleCancel} 
                                        disabled={isProcessing}
                                    >
                                        ❌ Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-gradient-upload-error border-2 border-destructive/20 rounded-2xl p-6 mb-8 shadow-lg animate-shake">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-upload-error-icon rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                                    <svg className="w-6 h-6 text-info-foreground" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-destructive font-bold text-xl mb-2">⚠️ Ошибка загрузки</p>
                                    <p className="text-destructive font-semibold text-base">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Information Section */}
                    {!isCompact && <div className="bg-surface rounded-3xl p-8 shadow-lg border border-border">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-info rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-info-foreground" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-foreground">Как это работает?</h3>
                                <p className="text-lg text-muted-foreground font-medium">Простые шаги для анализа ваших финансов</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-6 border border-border">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-destructive rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-destructive-foreground" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground mb-3 text-lg">PDF/PNG/JPG файлы</h4>
                                        <p className="text-base text-foreground leading-relaxed font-medium">
                                            Загрузите выписку из Kaspi, Halyk Bank или другого банка. 
                                            Наш ИИ автоматически распознает и извлечет все транзакции.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-success/10 to-success/20 rounded-2xl p-6 border border-border">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-success-foreground" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground mb-3 text-lg">CSV файлы</h4>
                                        <p className="text-base text-foreground leading-relaxed mb-3 font-medium">
                                            Подготовьте CSV файл с колонками:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            <code className="px-3 py-2 bg-surface rounded text-sm text-foreground border border-border font-semibold">Дата</code>
                                            <code className="px-3 py-2 bg-surface rounded text-sm text-foreground border border-border font-semibold">Описание</code>
                                            <code className="px-3 py-2 bg-surface rounded text-sm text-foreground border border-border font-semibold">Сумма</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-6 bg-gradient-to-r from-warning/10 to-warning/20 rounded-2xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-warning rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-warning-foreground" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-foreground text-lg">Безопасность данных</h4>
                            </div>
                            <p className="text-base text-foreground leading-relaxed font-medium">
                                Ваши финансовые данные обрабатываются локально и защищены по высшим стандартам безопасности. 
                                Мы не сохраняем и не передаем ваши личные данные третьим лицам.
                            </p>
                        </div>
                    </div>}
                </div>
            </div>
        </div>
    );
};

export default DataUpload;
