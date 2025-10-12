/**
 * デバッグログビューアコンポーネント
 * 開発者向けのログ確認ツール
 * 디버그 로그 뷰어 컴포넌트
 * 개발자용 로그 확인 도구
 */

import React, { useState, useEffect } from 'react';
import { getDebugLogs, exportDebugLogs, clearDebugLogs, LogEntry, LogLevel } from '~/utils/logger';

interface DebugLogViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DebugLogViewer({ isOpen, onClose }: DebugLogViewerProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // ログの読み込み
    // 로그의 읽기
    const loadLogs = () => {
        const debugLogs = getDebugLogs();
        setLogs(debugLogs);
    };

    useEffect(() => {
        if (isOpen) {
            loadLogs();
            // 1秒ごとにログを更新
            // 1초마다 로그를 업데이트
            const interval = setInterval(loadLogs, 1000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    // ログのフィルタリング
    // 로그의 필터링
    const filteredLogs = logs.filter(log => {
        const levelMatch = filter === 'ALL' || log.level === filter;
        const searchMatch = searchTerm === '' || 
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.context?.toLowerCase().includes(searchTerm.toLowerCase());
        return levelMatch && searchMatch;
    });

    // ログレベルの色分け
    // 로그 레벨의 색 구분
    const getLevelColor = (level: LogLevel) => {
        switch (level) {
            case LogLevel.DEBUG: return 'text-gray-500';
            case LogLevel.INFO: return 'text-blue-600';
            case LogLevel.WARN: return 'text-yellow-600';
            case LogLevel.ERROR: return 'text-red-600';
            case LogLevel.CRITICAL: return 'text-red-800 font-bold';
            default: return 'text-gray-700';
        }
    };

    const getLevelName = (level: LogLevel) => {
        switch (level) {
            case LogLevel.DEBUG: return 'DEBUG';
            case LogLevel.INFO: return 'INFO';
            case LogLevel.WARN: return 'WARN';
            case LogLevel.ERROR: return 'ERROR';
            case LogLevel.CRITICAL: return 'CRITICAL';
            default: return 'UNKNOWN';
        }
    };

    // ログのエクスポート
    // 로그의 익스포트
    const handleExport = () => {
        const logData = exportDebugLogs();
        const blob = new Blob([logData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ログのクリア
    // 로그의 클리어
    const handleClear = () => {
        if (confirm('すべてのログを削除しますか？ / 모든 로그를 삭제하시겠습니까?')) {
            clearDebugLogs();
            setLogs([]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
                {/* ヘッダー */}
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">デバッグログビューア / 디버그 로그 뷰어</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* コントロール */}
                {/* 컨트롤 */}
                <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">レベル / 레벨:</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as LogLevel | 'ALL')}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value="ALL">すべて / 전체</option>
                            <option value={LogLevel.DEBUG}>DEBUG</option>
                            <option value={LogLevel.INFO}>INFO</option>
                            <option value={LogLevel.WARN}>WARN</option>
                            <option value={LogLevel.ERROR}>ERROR</option>
                            <option value={LogLevel.CRITICAL}>CRITICAL</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">検索 / 검색:</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="メッセージまたはコンテキストで検索... / 메시지 또는 컨텍스트로 검색..."
                            className="border rounded px-2 py-1 text-sm w-64"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={loadLogs}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                            更新 / 업데이트
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                            エクスポート / 익스포트
                        </button>
                        <button
                            onClick={handleClear}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                            クリア / 클리어
                        </button>
                    </div>

                    <div className="text-sm text-gray-600">
                        ログ数 / 로그 수: {filteredLogs.length} / {logs.length}
                    </div>
                </div>

                {/* ログリスト */}
                {/* 로그 리스트 */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-2">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                ログがありません / 로그가 없습니다
                            </div>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <div
                                    key={index}
                                    className="border rounded p-3 bg-gray-50 hover:bg-gray-100"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-mono ${getLevelColor(log.level)}`}>
                                            {getLevelName(log.level)}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {log.timestamp}
                                        </span>
                                        {log.context && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {log.context}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm mb-2">{log.message}</div>
                                    {log.data && (
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                                データ / 데이터
                                            </summary>
                                            <pre className="mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                                                {JSON.stringify(log.data, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                    {log.stack && (
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                                スタックトレース / 스택 트레이스
                                            </summary>
                                            <pre className="mt-1 bg-white p-2 rounded border overflow-auto max-h-32 text-red-600">
                                                {log.stack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
