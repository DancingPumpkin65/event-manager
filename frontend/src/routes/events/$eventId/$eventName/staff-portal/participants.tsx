import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Button, Modal, Pagination, Skeleton, SkeletonTable } from '@/components/ui';
import { useStaffAuth } from '@/context/StaffContext';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import {
  getParticipantsQueryOptions,
  useCreateParticipant,
  useUpdateParticipant,
  useBulkCreateParticipants,
} from '@/features/participant/hooks/query-options';
import ParticipantList from '@/features/participant/components/participant-list';
import ParticipantForm from '@/features/participant/components/participant-form';
import ParticipantFilters from '@/features/participant/components/participant-filters';
import ParticipantExcelUpload from '@/features/participant/components/participant-excel-upload';
import type { ParticipantOutput, CreateParticipantInput } from '@/features/participant/types';
import { Sheet, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

// Skeleton for participants page - matches actual page layout
function ParticipantsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-40" />
          <Skeleton height="h-4" width="w-56" />
        </div>
        <div className="flex gap-3">
          <Skeleton height="h-10" width="w-32" className="rounded-lg" />
          <Skeleton height="h-10" width="w-36" className="rounded-lg" />
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Skeleton height="h-10" width="w-64" className="rounded-lg" />
        <Skeleton height="h-10" width="w-32" className="rounded-lg" />
        <Skeleton height="h-10" width="w-32" className="rounded-lg" />
        <Skeleton height="h-10" width="w-28" className="rounded-lg" />
      </div>
      {/* Table */}
      <SkeletonTable columns={6} rows={10} />
      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <Skeleton height="h-10" width="w-24" className="rounded" />
        <Skeleton height="h-10" width="w-10" className="rounded" />
        <Skeleton height="h-10" width="w-24" className="rounded" />
      </div>
    </div>
  );
}

const participantsSearchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  badgePrinted: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const Route = createFileRoute('/events/$eventId/$eventName/staff-portal/participants')({
  component: StaffParticipantsPage,
  pendingComponent: ParticipantsPageSkeleton,
  validateSearch: (search) => participantsSearchSchema.parse(search),
  loaderDeps: ({ search: { page, limit, search, status, badgePrinted, sortBy, order } }) => ({ page, limit, search, status, badgePrinted, sortBy, order }),
  loader: ({ context, params, deps: { page, limit, search, status, badgePrinted, sortBy, order } }) => {
    return context.queryClient.ensureQueryData(getParticipantsQueryOptions(params.eventId, page, limit, search, status, badgePrinted, sortBy, order));
  },
});

function StaffParticipantsPage() {
  const { eventId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { staff } = useStaffAuth();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const { data: participantsData, refetch } = useQuery({
    ...getParticipantsQueryOptions(
      eventId,
      search.page,
      search.limit,
      search.search,
      search.status,
      search.badgePrinted,
      search.sortBy,
      search.order
    ),
    placeholderData: (previousData) => previousData,
  });

  // Use server-side data directly
  const participants = participantsData?.participants || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantOutput | null>(null);

  const createMutation = useCreateParticipant();
  const updateMutation = useUpdateParticipant();
  const bulkImportMutation = useBulkCreateParticipants();

  const handlePageChange = useCallback((newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    });
  }, [navigate]);

  const handleSearchChange = useCallback((value: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: value || undefined, page: 1 }),
    });
  }, [navigate]);

  const handleStatusChange = useCallback((value: string) => {
    if (value === 'printed') {
      navigate({ search: (prev) => ({ ...prev, badgePrinted: true, status: undefined, page: 1 }) });
    } else if (value === 'not-printed') {
      navigate({ search: (prev) => ({ ...prev, badgePrinted: false, status: undefined, page: 1 }) });
    } else if (value === 'all') {
      navigate({ search: (prev) => ({ ...prev, status: undefined, badgePrinted: undefined, page: 1 }) });
    } else {
      navigate({ search: (prev) => ({ ...prev, status: value as any, badgePrinted: undefined, page: 1 }) });
    }
  }, [navigate]);

  const handleSortByChange = useCallback((value: 'createdAt' | 'status') => {
    navigate({ search: (prev) => ({ ...prev, sortBy: value, page: 1 }) });
  }, [navigate]);

  const handleOrderChange = useCallback((value: 'asc' | 'desc') => {
    navigate({ search: (prev) => ({ ...prev, order: value, page: 1 }) });
  }, [navigate]);

  const handleCreate = useCallback(async (data: CreateParticipantInput) => {
    await createMutation.mutateAsync(data);
    setShowAddModal(false);
    refetch();
  }, [createMutation, refetch]);

  // Use functional update pattern to avoid recreating callback when editingParticipant changes
  const handleUpdate = useCallback(async (data: CreateParticipantInput & { id?: string }) => {
    setEditingParticipant((current) => {
      if (current) {
        updateMutation.mutateAsync({ id: current.id, ...data }).then(() => refetch());
      }
      return null; // Close modal
    });
  }, [updateMutation, refetch]);



  const handleBulkImport = async (participantsData: Array<{ eventId: string; participantFields: Record<string, any> }>) => {
    const result = await bulkImportMutation.mutateAsync({
      eventId,
      participants: participantsData,
    });

    setShowUploadModal(false);
    refetch();

    if (result.failed > 0) {
      toast.warning(`Import complete: ${result.success} added, ${result.failed} failed`);
    } else {
      toast.success(`Import complete: ${result.success} participants added`);
    }
  };

  const participantFields = event.participantFields || [];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance">Participants</h1>
          <p className="text-gray-600">
            Manage participants for {event.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant='success' onClick={() => setShowUploadModal(true)}>
            <Sheet className="inline mr-2 w-5 h-5 text-green-500" /> Upload Excel
          </Button>
          <Button variant='primary' onClick={() => setShowAddModal(true)}>
            <UserPlus className="inline mr-2 w-5 h-5 text-blue-500" /> Add Participant
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ParticipantFilters
        currentSearch={search.search}
        currentStatus={search.status}
        currentBadgePrinted={search.badgePrinted}
        currentSortBy={search.sortBy}
        currentOrder={search.order}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onSortByChange={handleSortByChange}
        onOrderChange={handleOrderChange}
      />

      {/* Participants List */}
      <ParticipantList
        participants={participants}
        participantFields={participantFields}
        currentUserEmail={staff?.username || 'Staff'}
        onEdit={setEditingParticipant}
        onBadgePrintSuccess={() => refetch()}
        eventId={eventId}
      />

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          page={participantsData?.page || 1}
          totalPages={participantsData?.totalPages || 1}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Add Participant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Participant"
      >
        <ParticipantForm
          eventId={eventId}
          participantFields={participantFields}
          onSubmit={handleCreate}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <Modal
          isOpen={true}
          onClose={() => setEditingParticipant(null)}
          title="Edit Participant"
        >
          <ParticipantForm
            eventId={eventId}
            participantFields={participantFields}
            initialData={{
              eventId,
              participantFields: editingParticipant.participantFields,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingParticipant(null)}
            submitLabel="Update Participant"
          />
        </Modal>
      )}

      {/* Excel Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Import Participants from Excel"
      >
        <ParticipantExcelUpload
          eventId={eventId}
          participantFields={participantFields}
          onImport={handleBulkImport}
          onCancel={() => setShowUploadModal(false)}
        />
      </Modal>
    </div>
  );
}
