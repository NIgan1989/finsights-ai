
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

    const handleUpload = () => {
        if (selectedFile) {
            onFileUploaded(selectedFile);
            setSelectedFile(null);
        }
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
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                );
            case 'csv':
                return (
                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'png':
            case 'jpg':
            case 'jpeg':
                return (
                    <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className={isCompact ? "p-6" : "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden"}>
            {/* Background decorative elements */}
            {!isCompact && <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/10 rounded-full blur-3xl"></div>
            </div>}

            <div className={isCompact ? "" : "relative z-10 flex flex-col items-center justify-center min-h-screen p-6"}>
                <div className="text-center max-w-4xl w-full">
                    {/* Header Section */}
                    {!isCompact && <div className="mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                            Добро пожаловать в FinSights AI
                        </h1>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                            Ваш персональный финансовый ассистент с искусственным интеллектом. 
                            Начните с загрузки банковской выписки и получите детальный анализ ваших финансов.
                        </p>
                    </div>}

                    {/* Upload Section */}
                    {!selectedFile ? (
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 mb-8">
                            <div
                                {...getRootProps()}
                                className={`relative p-12 border-2 border-dashed rounded-2xl transition-all duration-300 transform ${
                                    isProcessing 
                                        ? 'cursor-wait bg-slate-50 border-slate-300' 
                                        : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'
                                } ${
                                    isDragActive 
                                        ? 'border-blue-500 bg-blue-50 scale-105' 
                                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                                }`}
                            >
                                <input {...getInputProps()} />
                                
                                <div className="flex flex-col items-center">
                                    {isProcessing ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                                <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900 mb-2">Обработка файла...</p>
                                            <p className="text-slate-600">Наш ИИ анализирует ваши данные</p>
                                        </div>
                                    ) : isDragActive ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
                                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-600 mb-2">Отпустите файл для загрузки</p>
                                            <p className="text-slate-600">Мы готовы обработать ваш документ</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12" />
                                                </svg>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900 mb-2">Перетащите файл сюда</p>
                                            <p className="text-slate-600 mb-4">или нажмите для выбора с компьютера</p>
                                            
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span>Поддерживаются:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-medium">PDF</span>
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-medium">CSV</span>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">PNG/JPG</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 mb-8">
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-4 mb-6">
                                    {getFileIcon(selectedFile.name)}
                                    <div className="text-left">
                                        <p className="text-lg font-semibold text-slate-900">Файл выбран</p>
                                        <p className="text-slate-600 text-sm">{selectedFile.name}</p>
                                        <p className="text-slate-500 text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button 
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                                        onClick={handleUpload} 
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Загрузка...' : 'Загрузить и анализировать'}
                                    </button>
                                    <button 
                                        className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                                        onClick={handleCancel} 
                                        disabled={isProcessing}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Information Section */}
                    {!isCompact && <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Как это работает?</h3>
                                <p className="text-slate-600">Простые шаги для анализа ваших финансов</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-2">PDF/PNG/JPG файлы</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            Загрузите выписку из Kaspi, Halyk Bank или другого банка. 
                                            Наш ИИ автоматически распознает и извлечет все транзакции.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-2">CSV файлы</h4>
                                        <p className="text-sm text-slate-700 leading-relaxed mb-2">
                                            Подготовьте CSV файл с колонками:
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            <code className="px-2 py-1 bg-white rounded text-xs text-slate-700 border">Дата</code>
                                            <code className="px-2 py-1 bg-white rounded text-xs text-slate-700 border">Описание</code>
                                            <code className="px-2 py-1 bg-white rounded text-xs text-slate-700 border">Сумма</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h4 className="font-semibold text-slate-900">Безопасность данных</h4>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
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
