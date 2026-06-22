'use client';

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[ErrorBoundary]', error, info.componentStack);
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        const { fallback, title = '読み込みに失敗しました', compact = false } = this.props;
        if (fallback) return fallback;

        if (compact) {
            return (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-600">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span className="font-medium">{title}</span>
                    <button onClick={() => this.setState({ hasError: false, error: null })}
                        className="ml-auto flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700">
                        <RefreshCw size={12} /> 再試行
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                    <AlertTriangle size={24} className="text-rose-400" />
                </div>
                <h3 className="text-base font-black text-slate-700 mb-1">{title}</h3>
                <p className="text-xs text-slate-400 mb-5">
                    {process.env.NODE_ENV === 'development' && this.state.error?.message
                        ? this.state.error.message
                        : 'しばらく経ってから再度お試しください。'}
                </p>
                <button onClick={() => this.setState({ hasError: false, error: null })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-black shadow-sm hover:shadow-md transition-all">
                    <RefreshCw size={14} /> 再読み込み
                </button>
            </div>
        );
    }
}
