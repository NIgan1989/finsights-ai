import React from 'react';

interface LoaderProps {
    message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Загрузка..." }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
            <p className="mt-4 text-lg text-gray-300">{message}</p>
        </div>
    );
};

export default Loader;
