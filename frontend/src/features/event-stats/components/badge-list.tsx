import { Pagination, SkeletonTable } from '@/components/ui';
import { getBadgeListQueryOptions } from '../hooks/query-options';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ParticipantBadgeInfo } from '../types';
import type { ParticipantFieldDefinition } from '@/features/event/types';

interface BadgeListProps {
    eventId: string;
    status: 'CONFIRMED' | 'PENDING';
    title: string;
    participantFields: ParticipantFieldDefinition[];
}

export function BadgeList({ eventId, status, title, participantFields }: BadgeListProps) {
    const [page, setPage] = useState(1);
    const limit = 10;

    // Use useQuery instead of useSuspenseQuery to avoid page refresh on pagination
    const { data, isLoading, isError } = useQuery(getBadgeListQueryOptions(eventId, status, page, limit));

    // Check if any participant has badgeId or badgePrintedAt
    const hasBadgeId = data?.participants?.some((p: ParticipantBadgeInfo) => p.badgeId != null) ?? false;
    const hasBadgePrintedAt = data?.participants?.some((p: ParticipantBadgeInfo) => p.badgePrintedAt != null) ?? false;

    // Calculate number of columns for skeleton (participant fields + conditional columns)
    const columnCount = participantFields.length + (hasBadgeId ? 1 : 0) + (hasBadgePrintedAt ? 1 : 0);
    const skeletonColumnCount = participantFields.length + 2; // For skeleton, assume both columns visible

    return (
        <div className="space-y-4 content-auto-lg">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {isLoading ? (
                <SkeletonTable columns={skeletonColumnCount} rows={5} />
            ) : isError ? (
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-4 py-6 text-center text-red-500">
                        Erreur lors du chargement des données.
                    </div>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {hasBadgeId && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    )}
                                    {participantFields.map((field) => (
                                        <th key={field.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            {field.label}
                                        </th>
                                    ))}
                                    {hasBadgePrintedAt && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Impression</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {!data || data.participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={columnCount || participantFields.length} className="px-4 py-6 text-center text-gray-500">
                                            No participant found.
                                        </td>
                                    </tr>
                                ) : (
                                    data.participants.map((p: ParticipantBadgeInfo) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            {hasBadgeId && (
                                                <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.badgeId || '-'}</td>
                                            )}
                                            {participantFields.map((field) => (
                                                <td key={field.name} className="px-4 py-3 text-sm text-gray-700">
                                                    <div className="max-w-xs truncate" title={p.participantFields?.[field.name]?.toString()}>
                                                        {p.participantFields?.[field.name] !== undefined
                                                            ? String(p.participantFields[field.name])
                                                            : '-'}
                                                    </div>
                                                </td>
                                            ))}
                                            {hasBadgePrintedAt && (
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {p.badgePrintedAt ? new Date(p.badgePrintedAt).toLocaleString() : '-'}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="p-4 flex justify-center border-t border-gray-200">
                            <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
