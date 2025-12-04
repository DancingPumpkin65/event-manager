import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Button, Modal, AlertDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getStaffWithFiltersQueryOptions, useCreateStaff, useUpdateStaff, useDeleteStaff } from '@/features/staff/hooks/query-options';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import StaffForm from '@/features/staff/components/staff-form';
import StaffList from '@/features/staff/components/staff-list';
import StaffFilters from '@/features/staff/components/staff-filters';
import type { Staff } from '@/features/staff/types';
import { UserPlus } from 'lucide-react';
import { z } from 'zod';

const staffSearchSchema = z.object({
  search: z.string().optional(),
  badgePrinted: z.string().optional(),
  sortBy: z.enum(['username', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const Route = createFileRoute('/admin/events/$eventId/$eventName/staff')({
  component: StaffManagementPage,
  validateSearch: (search) => staffSearchSchema.parse(search),
  loaderDeps: ({ search: { search, badgePrinted, sortBy, order } }) => ({ search, badgePrinted, sortBy, order }),
  loader: ({ context, params, deps: { search, badgePrinted, sortBy, order } }) => {
    const badgePrintedBool = badgePrinted === 'printed' ? true : badgePrinted === 'not-printed' ? false : undefined;
    context.queryClient.ensureQueryData(getStaffWithFiltersQueryOptions(params.eventId, { search, badgePrinted: badgePrintedBool, sortBy, order }));
    context.queryClient.ensureQueryData(getEventQueryOptions(params.eventId));
  },
});

function StaffManagementPage() {
  const { eventId } = Route.useParams();
  const searchParams = Route.useSearch();
  const search = searchParams.search;
  const badgePrinted = searchParams.badgePrinted;
  const sortBy = searchParams.sortBy || 'createdAt';
  const order = searchParams.order || 'desc';

  const navigate = useNavigate({ from: Route.fullPath });
  const { isAdmin } = useAuth();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));

  const badgePrintedBool = badgePrinted === 'printed' ? true : badgePrinted === 'not-printed' ? false : undefined;
  const { data: staff, refetch } = useQuery({
    ...getStaffWithFiltersQueryOptions(eventId, { search, badgePrinted: badgePrintedBool, sortBy, order }),
    placeholderData: (prev) => prev,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, search: value || undefined }),
    });
  };

  const handleStatusChange = (value: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, badgePrinted: value === 'all' ? undefined : value }),
    });
  };

  const handleSortByChange = (value: 'username' | 'createdAt') => {
    navigate({
      search: (prev: any) => ({ ...prev, sortBy: value }),
    });
  };

  const handleOrderChange = (value: 'asc' | 'desc') => {
    navigate({
      search: (prev: any) => ({ ...prev, order: value }),
    });
  };

  const handleCreate = useCallback(async (data: any) => {
    await createStaffMutation.mutateAsync(data);
    setShowCreateModal(false);
    refetch();
  }, [createStaffMutation, refetch]);

  // Use functional update pattern to avoid recreating callback when editingStaff changes
  const handleUpdate = useCallback(async (data: any) => {
    setEditingStaff((current) => {
      if (current) {
        updateStaffMutation.mutateAsync({ id: current.id, ...data }).then(() => refetch());
      }
      return null; // Close modal
    });
  }, [updateStaffMutation, refetch]);

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmationId(id);
  }, []);

  // Use functional update pattern to avoid recreating callback when deleteConfirmationId changes
  const confirmDelete = useCallback(async () => {
    setDeleteConfirmationId((currentId) => {
      if (currentId) {
        deleteStaffMutation.mutateAsync({ id: currentId, eventId }).then(() => refetch());
      }
      return null; // Close confirmation
    });
  }, [deleteStaffMutation, eventId, refetch]);

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance">Staff Management</h1>
            <p className="text-gray-600">
              Manage staff members for this event
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus className="inline mr-2 w-5 h-5 text-blue-500" /> Add Staff Member
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <StaffFilters
        currentSearch={search}
        currentStatus={badgePrinted as 'all' | 'printed' | 'not-printed' | undefined}
        currentSortBy={sortBy}
        currentOrder={order}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onSortByChange={handleSortByChange}
        onOrderChange={handleOrderChange}
      />

      <StaffList
        staff={staff || []}
        onEdit={setEditingStaff}
        onDelete={handleDelete}
        onBadgePrintSuccess={() => refetch()}
        isDeleting={deleteStaffMutation.isPending}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Staff Member"
      >
        <StaffForm
          eventId={eventId}
          staffFieldDefinitions={event && 'staffFields' in event ? event.staffFields || [] : []}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        title="Edit Staff Member"
      >
        {editingStaff && (
          <StaffForm
            eventId={eventId}
            staffFieldDefinitions={event && 'staffFields' in event ? event.staffFields || [] : []}
            initialData={editingStaff}
            onSubmit={handleUpdate}
            onCancel={() => setEditingStaff(null)}
            submitLabel="Update Staff"
          />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Delete Staff Member"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmLabel="Delete Staff Member"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteStaffMutation.isPending}
      />
    </div>
  );
}
