import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Button, Modal, Pagination, AlertDialog, Skeleton, SkeletonTable } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import {
  getParticipantsQueryOptions,
  useCreateParticipant,
  useUpdateParticipant,
  useDeleteParticipant,
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

// Skeleton for participants page
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
          <Skeleton height="h-10" width="w-32" />
          <Skeleton height="h-10" width="w-36" />
        </div>
      </div>
      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton height="h-10" width="w-64" />
        <Skeleton height="h-10" width="w-32" />
        <Skeleton height="h-10" width="w-32" />
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

export const Route = createFileRoute('/admin/events/$eventId/$eventName/participants')({
  component: ParticipantsPage,
  pendingComponent: ParticipantsPageSkeleton,
  validateSearch: (search) => participantsSearchSchema.parse(search),
  loaderDeps: ({ search: { page, limit, search, status, badgePrinted, sortBy, order } }) => ({ page, limit, search, status, badgePrinted, sortBy, order }),
  loader: ({ context, params, deps: { page, limit, search, status, badgePrinted, sortBy, order } }) => {
    return context.queryClient.ensureQueryData(getParticipantsQueryOptions(params.eventId, page, limit, search, status, badgePrinted, sortBy, order));
  },
});

function ParticipantsPage() {
  const { eventId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useAuth();
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
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const createMutation = useCreateParticipant();
  const updateMutation = useUpdateParticipant();
  const deleteMutation = useDeleteParticipant();
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
    // Value coming from UI might include badge status mixed in? No, ParticipantFilters needs update.
    // Assuming value is one of 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' or 'printed'/'not-printed'
    if (value === 'printed') {
      navigate({ search: (prev) => ({ ...prev, badgePrinted: true, status: undefined, page: 1 }) });
    } else if (value === 'not-printed') {
      navigate({ search: (prev) => ({ ...prev, badgePrinted: false, status: undefined, page: 1 }) });
    } else if (value === 'all') {
      navigate({ search: (prev) => ({ ...prev, status: undefined, badgePrinted: undefined, page: 1 }) });
    } else {
      // It's a proper status
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
    // Get current editing participant from state via setter
    setEditingParticipant((current) => {
      if (current) {
        updateMutation.mutateAsync({ id: current.id, ...data }).then(() => refetch());
      }
      return null; // Close modal
    });
  }, [updateMutation, refetch]);

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmationId(id);
  }, []);

  // Use functional update pattern to avoid recreating callback when deleteConfirmationId changes
  const confirmDelete = useCallback(async () => {
    setDeleteConfirmationId((currentId) => {
      if (currentId) {
        deleteMutation.mutateAsync(currentId).then(() => refetch());
      }
      return null; // Close confirmation
    });
  }, [deleteMutation, refetch]);

  const handleBulkImport = async (participantsData: Array<{ eventId: string; participantFields: Record<string, any> }>) => {
    const result = await bulkImportMutation.mutateAsync({
      eventId,
      participants: participantsData,
    });

    setShowUploadModal(false);
    refetch();

    // Show import summary
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
        currentUserEmail={user && 'email' in user ? user.email : user?.username || 'Unknown'}
        onEdit={setEditingParticipant}
        onDelete={handleDelete}
        onBadgePrintSuccess={() => refetch()}
        isDeleting={deleteMutation.isPending}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Delete Participant"
        description="Are you sure you want to delete this participant? This action cannot be undone and will remove all associated attendance records."
        confirmLabel="Delete Participant"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

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

