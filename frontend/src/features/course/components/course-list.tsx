import type { CourseOutput } from '../types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { Upload, SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface CourseListProps {
  courses: CourseOutput[];
  courseFields: ParticipantFieldDefinition[];
  onEdit: (course: CourseOutput) => void;
  onDelete: (courseId: string) => void;
  onImport: (course: CourseOutput) => void;
  isDeleting?: boolean;
}

export function CourseList({ courses, courseFields, onEdit, onDelete, onImport, isDeleting = false, }: CourseListProps) {

  const formatDateTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first course to get started</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile view */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">
                  {course.id.slice(0, 8)}
                </h3>
              </div>
              <div className="flex space-x-1">
                {course.requiresRegistration && (
                  <Button size='sm' variant='primary' className='!px-1 !py-1 h-8 w-8'
                    onClick={() => onImport(course)}
                    disabled={isDeleting}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
                <Button size='sm' variant='secondary' className='!px-1 !py-1 h-8 w-8'
                  onClick={() => onEdit(course)}
                  disabled={isDeleting}
                >
                  <SquarePen className="h-4 w-4" />
                </Button>
                <Button size='sm' variant='danger' className='!px-1 !py-1 h-8 w-8'
                  onClick={() => onDelete(course.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {courseFields.map((field) => (
                <div key={field.name}>
                  <p className="text-gray-500 text-xs">{field.label}</p>
                  <p className="font-medium">{course.courseFields?.[field.name] || '-'}</p>
                </div>
              ))}
              <div>
                <p className="text-gray-500 text-xs">Start Date</p>
                <p>{formatDateTime(course.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">End Date</p>
                <p>{formatDateTime(course.endDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Attendees</p>
                <p>{course._count?.attendance || 0}</p>
              </div>
            </div>

            {course.halls && course.halls.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs mb-1">Halls</p>
                <div className="flex flex-wrap gap-1">
                  {course.halls.map((hall) => (
                    <span
                      key={hall.hall.id}
                      className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
                    >
                      {hall.hall.hallFields?.name || `Hall ${hall.hall.id.slice(0, 8)}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {/* Dynamic columns based on courseFields */}
              {courseFields.map((field) => (
                <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Halls
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {course.id.slice(0, 8)}
                  </div>
                </td>
                {/* Dynamic column values */}
                {courseFields.map((field) => (
                  <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.courseFields?.[field.name] || '-'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.halls && course.halls.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {course.halls.map((hall) => (
                        <span
                          key={hall.hall.id}
                          className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
                        >
                          {hall.hall.hallFields?.name || `Hall ${hall.hall.id.slice(0, 8)}`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(course.startDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(course.endDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course._count?.attendance || 0}
                </td>
                <td className="whitespace-nowrap text-right px-3 py-4 text-sm space-x-1">
                  {course.requiresRegistration && (
                    <Button size='sm' variant='primary' className='!px-1 !border-none'
                      onClick={() => onImport(course)}
                      disabled={isDeleting}
                    >
                      <Upload className="h-5" />
                    </Button>
                  )}
                  <Button size='sm' variant='secondary' className='!px-1 !border-none'
                    onClick={() => onEdit(course)}
                    disabled={isDeleting}
                  >
                    <SquarePen className="h-5" />
                  </Button>
                  <Button size='sm' variant='danger' className='!px-1 !border-none'
                    onClick={() => onDelete(course.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
