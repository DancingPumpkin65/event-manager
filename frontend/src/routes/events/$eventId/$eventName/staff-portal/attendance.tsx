import { Alert, Button, SkeletonStatCard, SkeletonTable, Skeleton } from '@/components/ui';
import { QuickScan } from '@/components/ui/BarcodeScanner';
import { BadgeList } from '@/features/event-stats/components/badge-list';
import { BadgeStatsSummary } from '@/features/event-stats/components/badge-stats-summary';
import { CourseAttendanceList } from '@/features/event-stats/components/course-attendance-list';
import { getEventStatsQueryOptions } from '@/features/event-stats/hooks/query-options';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import { downloadExcel, generateAttendanceExcel } from '@/lib/excel-utils';
import { apiClient } from '@/lib/api-client';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

// Skeleton for attendance stats page
function AttendancePageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-64" />
          <Skeleton height="h-4" width="w-48" />
        </div>
        <Skeleton height="h-10" width="w-36" />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Table */}
      <SkeletonTable columns={5} rows={5} />
    </div>
  );
}

export const Route = createFileRoute('/events/$eventId/$eventName/staff-portal/attendance')({
  component: AttendancePage,
  pendingComponent: AttendancePageSkeleton,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(getEventQueryOptions(params.eventId)),
      context.queryClient.ensureQueryData(getEventStatsQueryOptions(params.eventId)),
    ]);
  },
});

function AttendancePage() {
  const { eventId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const { data: stats } = useSuspenseQuery(getEventStatsQueryOptions(eventId));

  const [showScanner, setShowScanner] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async (barcode: string) => {
    setError('');
    try {
      if (!barcode) throw new Error('Invalid barcode');
      await apiClient.createAttendance({ eventId, badgeId: barcode });
      queryClient.invalidateQueries({ queryKey: ['event-stats'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.message || 'Failed to process scan');
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      // Fetch all printed and not printed badges (limit = -1)
      const [printed, notPrinted] = await Promise.all([
        apiClient.getBadgeList(eventId, 'CONFIRMED', 1, -1),
        apiClient.getBadgeList(eventId, 'PENDING', 1, -1)
      ]);

      const workbook = await generateAttendanceExcel({
        eventName: event.name,
        eventLocation: event.location || undefined,
        startDate: new Date(event.startDate).toLocaleDateString(),
        endDate: new Date(event.endDate).toLocaleDateString(),
        reportDate: new Date().toLocaleDateString(),
        totalRegistered: stats.totalRegistered,
        badgesPrinted: stats.badgesPrinted,
        badgesNotPrinted: stats.badgesNotPrinted,
        participantFieldLabels: event.participantFields.map(f => f.label),
        participantFieldNames: event.participantFields.map(f => f.name),
        printedBadges: printed.participants,
        notPrintedBadges: notPrinted.participants,
        coursesWithAttendees: stats.coursesWithAttendees || [],
      });

      await downloadExcel(workbook, `${event.name.replace(/\s+/g, `_`)}_rapport_presence`);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to generate Excel report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance">Statistiques de Présence</h1>
          <p className="text-gray-600">Tableau de bord détaillé pour {event.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant='secondary' leftIcon={<FileSpreadsheet className="w-5 h-5" />} onClick={handleExportExcel} disabled={isExporting}>
            Exporter Excel
          </Button>
        </div>
      </div>

      {error && <Alert type="error" onClose={() => setError("")}>{error}</Alert>}

      {/* SECTION 1: BADGE STATS SUMMARY */}
      <BadgeStatsSummary stats={stats} />

      {/* SECTION 2: LISTE BADGE IMPRIMÉ */}
      <BadgeList
        eventId={eventId}
        status="CONFIRMED"
        title="Liste badge imprimé"
        participantFields={event.participantFields || []}
      />

      {/* SECTION 3: LISTE BADGE NON IMPRIMÉ */}
      <BadgeList
        eventId={eventId}
        status="PENDING"
        title="Liste badge NON imprimé"
        participantFields={event.participantFields || []}
      />

      {/* SECTION 4: LISTE PAR SALLE PAR TEMPS (COURSE ATTENDANCE) */}
      <CourseAttendanceList eventId={eventId} />

      {showScanner && (
        <QuickScan
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          eventName={event.name}
        />
      )}
    </div>
  );
}
