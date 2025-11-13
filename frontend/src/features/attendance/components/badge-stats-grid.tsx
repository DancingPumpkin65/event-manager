import { StatCard } from '@/features/dashboard/components';
import { Printer } from 'lucide-react';
import type { AttendanceStats } from '../types';

interface BadgeStatsGridProps {
    stats: AttendanceStats;
}

export function BadgeStatsGrid({ stats }: BadgeStatsGridProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Printed Card */}
                <StatCard
                    title="Nombre des badges imprimés Total"
                    value={stats.badgesPrinted}
                    icon={<Printer className="w-8 h-8" />}
                    color="blue"
                />
                <StatCard
                    title="Nombre des inscrits"
                    value={stats.totalRegistered}
                    icon={<Printer className="w-8 h-8" />}
                    color="purple"
                />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Détail par Type de Badge</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(stats.badgesPrintedByType || {}).map(([type, count]) => (
                    <div key={type} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Nombre des badges imprimés {type}</p>
                                <p className="text-2xl font-bold mt-2 text-gray-900 tabular-nums">
                                    {count}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full bg-blue-100 text-blue-600`}>
                                <Printer className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
                {Object.keys(stats.badgesPrintedByType || {}).length === 0 && (
                    <div className="col-span-4 text-center text-gray-500 py-4 border rounded-md border-dashed">
                        No badge type data available.
                    </div>
                )}
            </div>
        </div>
    );
}
