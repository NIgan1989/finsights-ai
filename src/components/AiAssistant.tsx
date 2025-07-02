import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage, FinancialReport } from '../types';
import { streamChatResponse } from '../services/openaiService';
import { Box, Paper, Typography, TextField, IconButton, Avatar, CircularProgress, Button } from '@mui/material';
import { Send as SendIcon, SmartToy as AiAssistantIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface AiAssistantProps {
    transactions: Transaction[];
    report: FinancialReport;
    dateRange: { start: string, end: string };
    onBack?: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ transactions, report, dateRange, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await streamChatResponse(input, transactions, report, dateRange);
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content += chunk.text;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error streaming response:", error);
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, an error occurred while processing your request." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{
            display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 48px)', // Adjust height based on AppBar and padding
        }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {onBack && (
                        <IconButton onClick={onBack} sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h4">
                        AI Assistant
                    </Typography>
                </Box>
                {onBack && (
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                    >
                        Назад к панели
                    </Button>
                )}
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', m: 'auto', color: 'text.secondary' }}>
                        <AiAssistantIcon sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6">Ask a question about your finances.</Typography>
                        <Typography variant="body2">For example: "What was my biggest expense this period?"</Typography>
                    </Box>
                )}
                {messages.map((msg, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
                            {msg.role === 'model' && <Avatar sx={{ bgcolor: 'primary.main' }}><AiAssistantIcon /></Avatar>}
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 1.5,
                                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
                                    color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                    borderRadius: msg.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                }}
                            >
                                {msg.content}
                                {isLoading && msg.role === 'model' && index === messages.length - 1 && <CircularProgress size={14} sx={{ ml: 1 }} />}
                            </Paper>
                        </Box>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Box>
            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isLoading ? "Assistant is thinking..." : "Ask something..."}
                    disabled={isLoading}
                    autoFocus
                />
                <IconButton type="submit" color="primary" disabled={isLoading || !input.trim()}>
                    {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Box>
        </Paper>
    );
};

export default AiAssistant;