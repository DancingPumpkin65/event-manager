import { Card } from '@/components/ui';
import { getCoursesWithAttendeesQueryOptions } from '../hooks/query-options';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { CourseWithAttendees } from '../types';

interface CourseAttendanceListProps {
    eventId: string;
}

export function CourseAttendanceList({ eventId }: CourseAttendanceListProps) {
    const { data: courses } = useSuspenseQuery(getCoursesWithAttendeesQueryOptions(eventId));
    const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(new Set());

    const toggleCourse = (courseId: string) => {
        setExpandedCourseIds((prev) => {
            const next = new Set(prev);
            if (next.has(courseId)) {
                next.delete(courseId);
            } else {
                next.add(courseId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4 content-auto-lg">
            <h3 className="text-lg font-semibold text-gray-900">Liste par salle par temps</h3>

            {courses.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border rounded-md border-dashed">
                    Aucun cours trouvé.
                </div>
            ) : (
                courses.map((course: CourseWithAttendees) => {
                    const isExpanded = expandedCourseIds.has(course.id);
                    return (
                        <Card key={course.id}>
                            {/* Course Header - Clickable */}
                            <button
                                onClick={() => toggleCourse(course.id)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
                            >
                                <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                                    <div className="col-span-2 text-sm font-medium text-gray-900 truncate" title={course.title}>
                                        {course.title}
                                    </div>
                                    <div className="text-sm text-gray-500 uppercase">{course.hallName}</div>
                                    <div className="col-span-2 text-sm text-gray-500">
                                        {new Date(course.startTime).toLocaleString()} - {new Date(course.endTime).toLocaleString()}
                                    </div>
                                    <div className="text-sm font-bold flex-end text-gray-900 tabular-nums">{course.attendeeCount} Pers</div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Attendees Table - Expandable */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    {course.attendees.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">No participant found.</p>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code Identifiant</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prenom</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {course.attendees.map((att, idx) => (
                                                    <tr key={idx} className="bg-white">
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-600">{att.badgeId || '-'}</td>
                                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{att.nom}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">{att.prenom}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })
            )}
        </div>
    );
}
