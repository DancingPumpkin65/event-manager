interface ParticipantBadgeListProps {
  participants: Array<{
    id: string;
    dynamicFields: Record<string, any>;
    badgePrintedAt?: Date;
    badgePrintedBy?: string;
  }>;
  title: string;
  emptyMessage: string;
  showPrintInfo?: boolean;
}

export function ParticipantBadgeList({ 
  participants, 
  title, 
  emptyMessage,
  showPrintInfo = false 
}: ParticipantBadgeListProps) {
  if (participants.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
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

  // Get all unique field keys from dynamic fields
  const allFieldKeys = Array.from(
    new Set(participants.flatMap(p => Object.keys(p.dynamicFields)))
  );

  return (
    <div className="card content-auto-lg">
      <h3 className="text-xl font-bold mb-4 text-balance">
        {title} ({participants.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {allFieldKeys.map((key) => (
                <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {key}
                </th>
              ))}
              {showPrintInfo && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Printed At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Printed By
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                {allFieldKeys.map((key) => (
                  <td key={key} className="px-4 py-3 text-sm text-gray-900">
                    {p.dynamicFields[key] || '-'}
                  </td>
                ))}
                {showPrintInfo && p.badgePrintedAt && (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDateTime(p.badgePrintedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {p.badgePrintedBy || '-'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
