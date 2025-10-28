interface BadgeStatsCardsProps {
  badgeStats: {
    participantBadgesPrinted: number;
    participantBadgesNotPrinted: number;
    staffBadgesPrinted: number;
    staffBadgesNotPrinted: number;
  };
  totalParticipants: number;
  totalStaff: number;
}

export function BadgeStatsCards({ badgeStats, totalParticipants, totalStaff }: BadgeStatsCardsProps) {
  const participantPrintRate = totalParticipants > 0 
    ? Math.round((badgeStats.participantBadgesPrinted / totalParticipants) * 100) 
    : 0;
  
  const staffPrintRate = totalStaff > 0
    ? Math.round((badgeStats.staffBadgesPrinted / totalStaff) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-sm text-green-700 mb-1">Participant Badges Printed</div>
        <div className="text-2xl font-bold text-green-900 tabular-nums">{badgeStats.participantBadgesPrinted}</div>
        <div className="text-xs text-green-600 mt-1 tabular-nums">{participantPrintRate}% of participants</div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-sm text-yellow-700 mb-1">Participant Badges Not Printed</div>
        <div className="text-2xl font-bold text-yellow-900 tabular-nums">{badgeStats.participantBadgesNotPrinted}</div>
        <div className="text-xs text-yellow-600 mt-1 tabular-nums">{100 - participantPrintRate}% remaining</div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-700 mb-1">Staff Badges Printed</div>
        <div className="text-2xl font-bold text-blue-900 tabular-nums">{badgeStats.staffBadgesPrinted}</div>
        <div className="text-xs text-blue-600 mt-1 tabular-nums">{staffPrintRate}% of staff</div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-700 mb-1">Staff Badges Not Printed</div>
        <div className="text-2xl font-bold text-gray-900 tabular-nums">{badgeStats.staffBadgesNotPrinted}</div>
        <div className="text-xs text-gray-600 mt-1 tabular-nums">{100 - staffPrintRate}% remaining</div>
      </div>
    </div>
  );
}
