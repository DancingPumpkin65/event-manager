import { Button, Modal } from '@/components/ui';
import type { AttendanceStats } from '../types';
import { useState } from 'react';

// We need a local or imported component for the attendees modal list
// Since we are refactoring, we'll keep the logic local to this component or import a helper
import { getAttendanceListQueryOptions } from '../hooks/query-options';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui';

interface CourseScheduleTableProps {
    eventId: string;
    stats: AttendanceStats;
}

export function CourseScheduleTable({ eventId, stats }: CourseScheduleTableProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Num Prog</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom Cours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date debut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date fin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pers (Attendees)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {(stats.courseStats || []).map((course) => (
                        <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.programNum || '-'}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate" title={course.title}>
                                {course.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.hallName || course.assignedHalls[0] || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {course.startTime ? new Date(course.startTime).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {course.endTime ? new Date(course.endTime).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.sessionType || 'C'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold tabular-nums">{course.attendeeCount} Pers</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedCourseId(course.id)}
                                >
                                    View
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {(!stats.courseStats || stats.courseStats.length === 0) && (
                        <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No courses scheduled.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {selectedCourseId && (
                <Modal
                    isOpen={!!selectedCourseId}
                    onClose={() => setSelectedCourseId(null)}
                    title="Détail des statistiques (Attendees)"
                    size="lg"
                >
                    <CourseAttendeesList eventId={eventId} courseId={selectedCourseId} />
                </Modal>
            )}
        </div>
    );
}

// Internal Sub-component for Course Attendees (Modal Content)
function CourseAttendeesList({ eventId, courseId }: { eventId: string; courseId: string; }) {
    const [page, setPage] = useState(1);
    const { data } = useSuspenseQuery(
        getAttendanceListQueryOptions(
            eventId,
            page,
            10,
            undefined, // search
            courseId,
            undefined, // hallId
            'checkInTime',
            'desc'
        )
    );

    return (
        <div className="p-4">
            {(!data.attendances || data.attendances.length === 0) ? (
                <div className="text-center text-gray-500 py-4">No filtered attendees found.</div>
            ) : (
                <div className="space-y-2">
                    {/* Table Header for Modal */}
                    <div className="grid grid-cols-3 gap-4 font-bold text-sm text-gray-700 pb-2 border-b">
                        <div>Code Identifiant</div>
                        <div>Nom</div>
                        <div>Prenom</div>
                    </div>

                    {(data.attendances || []).map(record => {
                        const fields = record.participant?.participantFields || {};
                        const nom = fields.nom || fields['Nom'] || fields.lastName || '-';
                        const prenom = fields.prenom || fields['Prenom'] || fields.firstName || '-';
                        const code = record.participant?.id || '-';

                        return (
                            <div key={record.id} className="grid grid-cols-3 gap-4 p-2 text-sm border-b last:border-0">
                                <div className="truncate font-mono text-gray-500">{code}</div>
                                <div className="truncate font-medium text-gray-900">{nom}</div>
                                <div className="truncate text-gray-700">{prenom}</div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div className="mt-4 flex justify-center">
                <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
        </div>
    )
}
