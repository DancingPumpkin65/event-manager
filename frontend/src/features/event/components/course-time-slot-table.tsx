interface CourseTimeSlotTableProps {
  courses: Array<{
    id: string;
    title: string;
    type: string;
    startDate: Date;
    endDate: Date;
    capacity: number | null;
    instructor: string | null;
    halls: Array<{
      id: string;
      salle: {
        id: string;
        name: string;
      };
    }>;
    _count: {
      registrations: number;
    };
  }>;
}

export function CourseTimeSlotTable({ courses }: CourseTimeSlotTableProps) {
  if (courses.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Courses by Time Slot</h3>
        <p className="text-gray-500 text-center py-8">No courses scheduled for this event</p>
      </div>
    );
  }

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="card content-auto-lg">
      <h3 className="text-xl font-bold mb-4 text-balance">
        Courses by Time Slot ({courses.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Course Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Instructor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Halls
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                End Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Capacity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registered
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {course.title}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {course.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {course.instructor || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {course.halls.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {course.halls.map((hall) => (
                        <span
                          key={hall.id}
                          className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
                        >
                          {hall.salle.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {formatDateTime(course.startDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {formatDateTime(course.endDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {course.capacity || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className={course._count.registrations > (course.capacity || Infinity) ? 'text-red-600 font-semibold' : ''}>
                    {course._count.registrations}
                  </span>
                  {course.capacity && ` / ${course.capacity}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
