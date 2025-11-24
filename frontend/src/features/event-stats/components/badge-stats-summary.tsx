import { Printer } from 'lucide-react';
import type { EventStatsResponse } from '../types';

interface BadgeStatsSummaryProps {
    stats: EventStatsResponse;
}

export function BadgeStatsSummary({ stats }: BadgeStatsSummaryProps) {
    return (
        <div className="space-y-6">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Nombre des inscrits</p>
                            <p className="text-3xl font-bold mt-2 text-gray-900 tabular-nums">{stats.totalRegistered}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <Printer className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Badges Imprimés</p>
                            <p className="text-3xl font-bold mt-2 text-green-600 tabular-nums">{stats.badgesPrinted}</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Printer className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Badges Non Imprimés</p>
                            <p className="text-3xl font-bold mt-2 text-orange-600 tabular-nums">{stats.badgesNotPrinted}</p>
                        </div>
                        <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                            <Printer className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
