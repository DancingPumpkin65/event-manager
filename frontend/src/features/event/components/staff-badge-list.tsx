interface StaffBadgeListProps {
  staff: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    badgePrintedAt: Date;
    badgePrintedBy: string | null;
  }>;
}

export function StaffBadgeList({ staff }: StaffBadgeListProps) {
  if (staff.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Staff with Badges Printed</h3>
        <p className="text-gray-500 text-center py-8">No staff badges have been printed yet</p>
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
        Staff with Badges Printed ({staff.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Printed At</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Printed By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {s.firstName} {s.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{s.email}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{s.username}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDateTime(s.badgePrintedAt)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {s.badgePrintedBy || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
