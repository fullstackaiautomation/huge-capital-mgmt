import { useState, useMemo } from 'react';
import { X, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import type { DealFundingPosition } from '../../types/deals';

interface FundingPositionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    positions: Array<DealFundingPosition & { statement_month: string; status: string }>;
}

type SortColumn = 'date' | 'status' | 'lender' | 'amount' | 'frequency' | 'month';
type SortDirection = 'asc' | 'desc';

export default function FundingPositionsModal({ isOpen, onClose, positions }: FundingPositionsModalProps) {
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'New' | 'Unclear' | 'Closed'>('All');
    const [sortColumn, setSortColumn] = useState<SortColumn>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    if (!isOpen) return null;

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection(column === 'amount' ? 'desc' : 'asc');
        }
    };

    // Flatten positions into individual transactions based on detected_dates
    const transactions = useMemo(() => {
        const flat = positions.flatMap(position =>
            position.detected_dates.map(date => ({
                date,
                lender: position.lender_name,
                amount: position.amount,
                frequency: position.frequency,
                month: position.statement_month,
                status: position.status,
                originalPosition: position
            }))
        ).filter(tx => filterStatus === 'All' || tx.status === filterStatus);

        // Sort based on current sort settings
        return flat.sort((a, b) => {
            let comparison = 0;
            switch (sortColumn) {
                case 'date':
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'lender':
                    comparison = a.lender.localeCompare(b.lender);
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'frequency':
                    comparison = (a.frequency || '').localeCompare(b.frequency || '');
                    break;
                case 'month':
                    comparison = (a.month || '').localeCompare(b.month || '');
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [positions, filterStatus, sortColumn, sortDirection]);

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'New': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'Unclear': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) {
            return <ChevronUp className="w-3 h-3 opacity-30" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUp className="w-3 h-3 text-indigo-400" />
            : <ChevronDown className="w-3 h-3 text-indigo-400" />;
    };

    const ColumnHeader = ({ column, label, align = 'left' }: { column: SortColumn; label: string; align?: 'left' | 'right' }) => (
        <th
            className={`px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors select-none ${align === 'right' ? 'text-right' : ''}`}
            onClick={() => handleSort(column)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
                {label}
                <SortIcon column={column} />
            </div>
        </th>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gray-800/50 rounded-t-xl">
                    <div className="flex items-center gap-6">
                        <div>
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                Funding Positions Ledger
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {transactions.length} transactions detected
                            </p>
                        </div>

                        {/* Filter Bar */}
                        <div className="flex items-center gap-2">
                            {(['All', 'Active', 'New', 'Unclear', 'Closed'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterStatus === status
                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                                            : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:bg-gray-800 hover:text-gray-300'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="rounded-lg border border-gray-700 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-800 text-gray-400 font-medium uppercase text-xs">
                                <tr>
                                    <ColumnHeader column="date" label="Date" />
                                    <ColumnHeader column="status" label="Status" />
                                    <ColumnHeader column="lender" label="Lender" />
                                    <ColumnHeader column="amount" label="Amount" align="right" />
                                    <ColumnHeader column="frequency" label="Frequency" />
                                    <ColumnHeader column="month" label="Statement" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                                {transactions.map((tx, i) => (
                                    <tr key={`${tx.date}-${i}`} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white font-mono">
                                            {new Date(tx.date).toLocaleDateString('en-US', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-white font-medium">
                                            {tx.lender}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-400 font-mono">
                                            ${tx.amount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 capitalize">
                                            {tx.frequency}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {tx.month}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 bg-gray-800/30 rounded-b-xl flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        Click column headers to sort
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Total Detected Volume:</span>
                        <span className="text-white font-bold font-mono">${totalAmount.toLocaleString()}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
