import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Modal, Pagination, AlertDialog, Skeleton, SkeletonTable } from '@/components/ui';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import { getSallesQueryOptions, useCreateHall, useUpdateHall, useDeleteHall } from '@/features/hall/hooks/query-options';
import { z } from 'zod';
import { HallFilters } from '@/features/hall/components/hall-filters';
import DynamicFormFields from '@/features/shared/components/dynamic-form-fields';
import type { SalleOutput, CreateSalleInput } from '@/features/salle/types';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { SquarePen, SquarePlus, Trash2 } from 'lucide-react';

// Skeleton for halls page - matches actual page layout
function HallsPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-48" />
          <Skeleton height="h-4" width="w-56" />
        </div>
        <Skeleton height="h-10" width="w-28" className="rounded-lg" />
      </div>
      {/* Filters - matches HallFilters layout */}
      <div className="flex flex-wrap gap-4">
        <Skeleton height="h-10" width="w-64" className="rounded-lg" />
        <Skeleton height="h-10" width="w-36" className="rounded-lg" />
        <Skeleton height="h-10" width="w-28" className="rounded-lg" />
      </div>
      {/* Table - matches the desktop table layout */}
      <SkeletonTable columns={4} rows={8} />
      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Skeleton height="h-10" width="w-24" className="rounded" />
        <Skeleton height="h-10" width="w-10" className="rounded" />
        <Skeleton height="h-10" width="w-24" className="rounded" />
      </div>
    </div>
  );
}

const sallesQuerySchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const Route = createFileRoute('/admin/events/$eventId/$eventName/halls')({
  component: HallsPage,
  pendingComponent: HallsPageSkeleton,
  validateSearch: (search) => sallesQuerySchema.parse(search),
  loaderDeps: ({ search: { page, limit, search, sortBy, order } }) => ({ page, limit, search, sortBy, order }),
  loader: ({ context, params, deps: { page, limit, search, sortBy, order } }) => {
    return context.queryClient.ensureQueryData(getSallesQueryOptions(page, limit, params.eventId, search, sortBy, order));
  },
});

function HallsPage() {
  const { eventId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const { data: sallesData, refetch } = useQuery({
    ...getSallesQueryOptions(search.page, search.limit, eventId, search.search, search.sortBy, search.order),
    placeholderData: (prev) => prev,
  });

  const halls = sallesData?.salles || [];

  const [showForm, setShowForm] = useState(false);
  const [editingHall, setEditingHall] = useState<SalleOutput | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const createMutation = useCreateHall();
  const updateMutation = useUpdateHall();
  const deleteMutation = useDeleteHall();

  const hallFields = event.hallFields || [];

  const handlePageChange = (newPage: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: newPage }),
    });
  };

  const handleSearchChange = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, search: value || undefined, page: 1 }),
    });
  };

  const handleSortByChange = (value: 'createdAt') => {
    navigate({
      search: (prev) => ({ ...prev, sortBy: value, page: 1 }),
    });
  };

  const handleOrderChange = (value: 'asc' | 'desc') => {
    navigate({
      search: (prev) => ({ ...prev, order: value, page: 1 }),
    });
  };

  const handleCreate = async (data: CreateSalleInput) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
    refetch();
  };

  const handleUpdate = async (data: CreateSalleInput) => {
    if (!editingHall) return;
    await updateMutation.mutateAsync({
      id: editingHall.id,
      eventId,
      data: { hallFields: data.hallFields }
    });
    setEditingHall(null);
    setShowForm(false);
    refetch();
  };

  const handleDelete = (hallId: string) => {
    setDeleteConfirmationId(hallId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      await deleteMutation.mutateAsync({ id: deleteConfirmationId, eventId });
      setDeleteConfirmationId(null);
      refetch();
    }
  };

  const handleEdit = (hall: SalleOutput) => {
    setEditingHall(hall);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingHall(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-8" >
      {/* Header Card */}
      < div className="" >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance">Halls Management</h1>
            <p className="text-gray-600">
              Manage halls for {event.name}
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <SquarePlus className="inline mr-2 w-5 h-5" />Add Hall
            </Button>
          )}
        </div>
      </div >

      {/* Filters */}
      < HallFilters
        currentSearch={search.search}
        currentSortBy={search.sortBy}
        currentOrder={search.order}
        onSearchChange={handleSearchChange}
        onSortByChange={handleSortByChange}
        onOrderChange={handleOrderChange}
      />
      <Modal
        isOpen={showForm}
        onClose={handleCancelEdit}
        title={editingHall ? 'Edit Hall' : 'Add New Hall'}
      >
        <HallForm
          eventId={eventId}
          hallFields={hallFields}
          initialData={editingHall ? {
            hallFields: editingHall.hallFields,
          } : undefined}
          onSubmit={editingHall ? handleUpdate : handleCreate}
          onCancel={handleCancelEdit}
          submitLabel={editingHall ? 'Update Hall' : 'Create Hall'}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Halls List/Table */}
      <div className="overflow-hidden">
        {halls.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No halls found</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first hall to get started</p>
          </div>
        ) : (
          <div>
            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {halls.map((hall) => (
                <div key={hall.id} className="bg-white p-4 rounded-lg shadow space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {hall.hallFields?.name || `Hall ${hall.id.slice(0, 8)}`}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button size='sm' className='!px-1 !py-1 h-8 w-8'
                        onClick={() => handleEdit(hall)}
                      >
                        <SquarePen className="h-4 w-4" />
                      </Button>
                      <Button variant='danger' size='sm' className='!px-1 !py-1 h-8 w-8'
                        onClick={() => handleDelete(hall.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {hallFields.map((field) => (
                      <div key={field.name}>
                        <p className="text-gray-500 text-xs">{field.label}</p>
                        <p className="font-medium">{hall.hallFields?.[field.name] ?? '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {/* Dynamic columns based on hallFields */}
                    {hallFields.map((field) => (
                      <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {halls.map((hall) => (
                    <tr key={hall.id} className="hover:bg-gray-50">
                      {/* Dynamic column values */}
                      {hallFields.map((field) => (
                        <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hall.hallFields?.[field.name] ?? '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 justify-end">
                          <Button variant='secondary' size='sm' className='!px-1 border-none'
                            onClick={() => handleEdit(hall)}
                          >
                            <SquarePen className="h-5" />
                          </Button>
                          <Button variant='danger' size='sm' className='!px-1 border-none'
                            onClick={() => handleDelete(hall.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={sallesData?.page || 1}
        totalPages={sallesData?.totalPages || 1}
        onPageChange={handlePageChange}
      />


      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Delete Hall"
        description="Are you sure you want to delete this hall? This action cannot be undone and may affect associated courses."
        confirmLabel="Delete Hall"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div >
  );
}

// Hall Form Component
interface HallFormProps {
  eventId: string;
  hallFields: ParticipantFieldDefinition[];
  initialData?: {
    hallFields?: Record<string, any>;
  };
  onSubmit: (data: CreateSalleInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

function HallForm({
  eventId,
  hallFields,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Hall',
  isLoading = false,
}: HallFormProps) {
  const [hallFieldsData, setHallFieldsData] = useState<Record<string, any>>(
    initialData?.hallFields || {}
  );
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    for (const field of hallFields) {
      if (field.required && !hallFieldsData[field.name]) {
        setError(`${field.label} is required`);
        return;
      }
    }

    try {
      await onSubmit({
        eventId,
        hallFields: hallFieldsData,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save hall');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Dynamic Hall Fields */}
      {hallFields.length > 0 && (
        <DynamicFormFields
          fields={hallFields}
          values={hallFieldsData}
          onChange={setHallFieldsData}
        />
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
