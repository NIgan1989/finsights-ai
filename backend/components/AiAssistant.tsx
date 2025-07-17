
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage, FinancialReport, BusinessProfile } from '../../types.ts';
import { useUser } from './UserContext';
import { subscriptionService } from '../../services/subscriptionService';
// import { streamChatResponse } from '../services/geminiService.ts';
// import { AiAssistantIcon, SendIcon } from './icons.tsx';

interface AiAssistantProps {
    transactions: Transaction[];
    report: FinancialReport;
    dateRange: { start: string, end: string };
    profile: BusinessProfile | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ transactions, report, dateRange, profile }) => {
    const { googleId, email, subscriptionInfo } = useUser();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Проверяем лимит ИИ запросов
        const limitCheck = subscriptionService.checkAiRequestLimit();
        if (!limitCheck.allowed) {
            subscriptionService.showUpgradeModal(limitCheck.reason || 'Лимит ИИ запросов достигнут');
            return;
        }

        const newUserMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        // Увеличиваем счетчик ИИ запросов
        const userId = googleId || email || 'demo-user';
        await subscriptionService.incrementAiRequests(userId);

        try {
            const response = await fetch('http://localhost:3001/api/openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, newUserMessage],
                    transactions,
                    report,
                    dateRange,
                    profile
                }),
            });
            const data = await response.json();
            if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Ошибка: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Извините, произошла ошибка при обработке вашего запроса." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 flex flex-col h-full max-h-[calc(100vh-4.75rem)]">
            <h1 className="text-3xl font-bold text-text-primary mb-6">ИИ Ассистент</h1>
            <div className="flex-grow bg-surface rounded-2xl border border-border shadow-lg flex flex-col overflow-hidden">
                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {messages.length === 0 && (
                        <div className="text-center text-text-secondary flex flex-col items-center justify-center h-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mb-4 text-primary"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
                            <p className="text-lg">Задайте вопрос о ваших финансах.</p>
                            <p className="text-sm">Например: "Какой был самый большой расход за этот период?"</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-foreground"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg></div>}
                            <div className={`max-w-xl p-4 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-surface-accent text-text-primary rounded-bl-none'}`}>
                                {msg.content}
                                {isLoading && msg.role === 'model' && index === messages.length - 1 && <span className="inline-block w-2 h-2 ml-2 bg-text-primary rounded-full animate-ping"></span>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-surface border-t border-border">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isLoading ? "Ассистент думает..." : "Спросите что-нибудь..."}
                            disabled={isLoading}
                            className="flex-grow p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-primary rounded-lg text-primary-foreground disabled:bg-surface-accent disabled:text-text-disabled disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m12 2 8 6-8 6-8-6 8-6"/></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;
