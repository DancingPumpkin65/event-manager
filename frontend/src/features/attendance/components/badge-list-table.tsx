import { Pagination } from '@/components/ui';
import { getParticipantsQueryOptions } from '@/features/participant/hooks/query-options';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface BadgeListTableProps {
    eventId: string;
    type: 'printed' | 'not-printed';
}

export function BadgeListTable({ eventId, type }: BadgeListTableProps) {
    const isPrinted = type === 'printed';
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data } = useSuspenseQuery(
        getParticipantsQueryOptions(
            eventId,
            page,
            limit,
            undefined, // search
            undefined, // status
            isPrinted, // badgePrinted
            'createdAt',
            'desc'
        )
    );

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prenom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ville</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Badge</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialite</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {(!data.participants || data.participants.length === 0) ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No participants found.</td>
                        </tr>
                    ) : (
                        (data.participants || []).map((p) => {
                            const fields = p.participantFields as Record<string, any>;
                            const nom = fields.nom || fields['Nom'] || fields.lastName || '-';
                            const prenom = fields.prenom || fields['Prenom'] || fields.firstName || '-';

                            // Dynamic field lookup (case sensitive matching usually, but simplified here)
                            const ville = fields.ville || fields['Ville'] || fields.city || '-';
                            const sponsor = fields.sponsor || fields['Sponsor'] || '-';
                            const typeBadge = fields['type badge'] || fields['Type Badge'] || fields['Type badge'] || '-';
                            const specialite = fields.specialite || fields['Specialite'] || '-';
                            const date = isPrinted && p.badgePrintedAt
                                ? new Date(p.badgePrintedAt).toLocaleString()
                                : '-';

                            return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{nom}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prenom}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ville}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sponsor}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeBadge}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{specialite}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{date}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            <div className="p-4 flex justify-center border-t border-gray-200">
                <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
        </div>
    );
}
