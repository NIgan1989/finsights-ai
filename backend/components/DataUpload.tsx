
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon } from './icons.tsx';

interface DataUploadProps {
    onFileUploaded: (file: File) => void;
    isProcessing: boolean;
}

const DataUpload: React.FC<DataUploadProps> = ({ onFileUploaded, isProcessing }) => {
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);
        if (rejectedFiles && rejectedFiles.length > 0) {
            setError('Неверный тип файла. Пожалуйста, загрузите файл в формате CSV, PDF, PNG или JPG.');
            return;
        }

        const file = acceptedFiles[0];
        if (file) {
            onFileUploaded(file);
        }
    }, [onFileUploaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
        },
        multiple: false,
        disabled: isProcessing,
    });

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
            <div className="text-center max-w-2xl w-full">
                <h1 className="text-4xl font-bold text-text-primary mb-2">Добро пожаловать в FinSights AI</h1>
                <p className="text-lg text-text-secondary mb-8">Ваш персональный финансовый ассистент. Начните с загрузки выписки по счету.</p>

                <div
                    {...getRootProps()}
                    className={`p-10 border-2 border-dashed rounded-2xl transition-colors duration-300 ${isProcessing ? 'cursor-wait bg-surface' : 'cursor-pointer'} ${isDragActive ? 'border-primary bg-surface' : 'border-border hover:border-primary hover:bg-surface'}`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center text-text-secondary">
                        <UploadIcon className="w-12 h-12 mb-4" />
                        { isProcessing ? (
                             <p className="text-xl text-text-primary">Обработка файла...</p>
                        ) : isDragActive ? (
                            <p className="text-xl text-primary">Отпустите файл для загрузки</p>
                        ) : (
                            <p className="text-xl text-text-primary">Перетащите сюда файл или нажмите для выбора</p>
                        )}
                        <p className="text-sm mt-2">Поддерживаются форматы: PDF, PNG, JPG, CSV</p>
                    </div>
                </div>
                
                {error && <p className="text-destructive mt-4">{error}</p>}
                
                <div className="mt-8 text-left bg-surface p-6 rounded-2xl border border-border shadow-lg w-full">
                    <h3 className="font-semibold text-text-primary mb-3">Как это работает:</h3>
                    <ul className="text-sm text-text-secondary list-disc list-inside space-y-2">
                        <li><b>Для PDF/PNG/JPG:</b> Загрузите выписку из Kaspi, Halyk или другого банка. Наш ИИ автоматически распознает и извлечет транзакции.</li>
                        <li><b>Для CSV:</b> Файл должен содержать колонки <code className="bg-background px-1.5 py-0.5 rounded text-text-primary">Дата</code>, <code className="bg-background px-1.5 py-0.5 rounded text-text-primary">Описание</code>, <code className="bg-background px-1.5 py-0.5 rounded text-text-primary">Сумма</code>.</li>
                     </ul>
                </div>
            </div>
        </div>
    );
};

export default DataUpload;
