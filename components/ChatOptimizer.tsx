import React, { useState, useEffect, useRef } from 'react';

const CopyButton = ({ text }: { text: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={handleCopy}
            className="absolute top-1 right-1 p-1 bg-theme-surface hover:bg-theme-border text-theme-text-secondary hover:text-white transition rounded-full"
            aria-label="Copy prompt"
            title="Copy prompt"
        >
            {isCopied ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
        </button>
    );
};

export const ChatOptimizer = ({ history, isOptimizing, onSendMessage, isConfigured, systemPrompt, onSystemPromptChange }) => {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [history, isOptimizing]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-theme-surface/50 rounded-lg">
            {/* Green Section: System Prompt */}
            <div className="flex-shrink-0 border-b border-theme-border px-3 py-2">
                <button
                    onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                    className="w-full flex justify-between items-center text-left text-xs font-semibold text-theme-accent hover:text-white"
                >
                    <span>SYSTEM PROMPT</span>
                    <svg
                        className={`w-4 h-4 transition-transform transform ${isSystemPromptOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isSystemPromptOpen && (
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => onSystemPromptChange(e.target.value)}
                        className="mt-2 p-2 bg-theme-bg/30 text-xs text-theme-text-secondary italic rounded-md w-full resize-y h-28 border border-theme-border focus:ring-1 focus:ring-theme-primary"
                        aria-label="System Prompt"
                    />
                )}
            </div>

            {/* Red Section: Chat History */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {history.map((chat, index) => (
                    <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 text-sm relative ${chat.role === 'user' ? 'bg-theme-primary text-white rounded-l-xl rounded-br-xl' : 'bg-theme-surface-2 text-theme-text rounded-r-xl rounded-bl-xl'}`}>
                            <p className="whitespace-pre-wrap">{chat.text}</p>
                            {chat.role === 'model' && <CopyButton text={chat.text} />}
                        </div>
                    </div>
                ))}
                {isOptimizing && (
                    <div className="flex justify-start">
                         <div className="max-w-xs p-3 text-sm bg-theme-surface-2 text-theme-text-secondary rounded-r-xl rounded-bl-xl">
                            <div className="flex items-center gap-2">
                                <div className="spinner !w-4 !h-4 !border-theme-text-secondary !border-t-transparent"></div>
                                <span>Optimizing...</span>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Yellow Section: Input */}
            <div className="flex-shrink-0 p-2 border-t border-theme-border">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isConfigured ? "Enter an idea, e.g., 'a cat in space'" : "Set API Key in Settings to use chat"}
                        className="flex-grow p-2 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition resize-none text-sm"
                        rows={2}
                        disabled={isOptimizing || !isConfigured}
                    />
                    <button type="submit" className="px-4 py-2 h-full bg-theme-primary text-white font-bold hover:bg-theme-primary-hover transition rounded-md disabled:bg-theme-surface-2 disabled:text-theme-text-secondary" disabled={isOptimizing || !message.trim() || !isConfigured}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};