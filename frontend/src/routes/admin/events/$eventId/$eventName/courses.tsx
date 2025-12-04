import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Modal, Pagination, AlertDialog, Skeleton } from '@/components/ui';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import { getCoursesQueryOptions, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/features/course/hooks/query-options';
import { getHallsQueryOptions } from '@/features/hall/hooks/query-options';
import { getParticipantsQueryOptions } from '@/features/participant/hooks/query-options';
import { CourseList } from '@/features/course/components/course-list';
import { CourseFilters } from '@/features/course/components/course-filters';
import CourseForm from '@/features/course/components/course-form';
import type { CourseOutput, CreateCourseInput } from '@/features/course/types';
import { ManageRegistrationsForm } from '@/features/course/components/manage-registrations/manage-registrations-form';
import { ClockPlus } from 'lucide-react';
import { z } from 'zod';

// Skeleton for courses page - matches actual page layout
function CoursesPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-32" />
          <Skeleton height="h-4" width="w-48" />
        </div>
        <Skeleton height="h-10" width="w-32" className="rounded-lg" />
      </div>
      {/* Filters - matches CourseFilters layout */}
      <div className="flex flex-wrap gap-4">
        <Skeleton height="h-10" width="w-64" className="rounded-lg" />
        <Skeleton height="h-10" width="w-36" className="rounded-lg" />
        <Skeleton height="h-10" width="w-28" className="rounded-lg" />
      </div>
      {/* Course cards grid - matches CourseList layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton height="h-5" width="w-3/4" />
              <Skeleton height="h-6" width="w-16" className="rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton height="h-4" width="w-full" />
              <Skeleton height="h-4" width="w-2/3" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton height="h-8" width="w-20" className="rounded" />
              <Skeleton height="h-8" width="w-20" className="rounded" />
              <Skeleton height="h-8" width="w-8" className="rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Skeleton height="h-10" width="w-24" className="rounded" />
        <Skeleton height="h-10" width="w-10" className="rounded" />
        <Skeleton height="h-10" width="w-24" className="rounded" />
      </div>
    </div>
  );
}

const coursesSearchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  search: z.string().optional(),
  sortBy: z.enum(['startDate', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const Route = createFileRoute('/admin/events/$eventId/$eventName/courses')({
  component: CoursesPage,
  pendingComponent: CoursesPageSkeleton,
  validateSearch: (search) => coursesSearchSchema.parse(search),
  loaderDeps: ({ search: { page, limit, search, sortBy, order } }) => ({ page, limit, search, sortBy, order }),
  loader: async ({ context, params, deps: { page, limit, search, sortBy, order } }) => {
    // Prefetch data needed for the page
    await Promise.all([
      context.queryClient.ensureQueryData(getEventQueryOptions(params.eventId)),
      context.queryClient.ensureQueryData(getCoursesQueryOptions(params.eventId, page, limit, search, sortBy, order)),
      context.queryClient.ensureQueryData(getHallsQueryOptions(params.eventId)),
      // We don't need all participants for the list view, maybe for the dropdown in modal?
      // Keeping it for now but optimizing later might be good
      context.queryClient.ensureQueryData(getParticipantsQueryOptions(params.eventId)),
    ]);
  },
});

function CoursesPage() {
  const { eventId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const { data: coursesData, refetch } = useQuery({
    ...getCoursesQueryOptions(eventId, search.page, search.limit, search.search, search.sortBy, search.order),
    placeholderData: (prev) => prev,
  });
  const { data: halls = [] } = useSuspenseQuery(getHallsQueryOptions(eventId));
  const { data: participantsData } = useSuspenseQuery(getParticipantsQueryOptions(eventId));

  const courses = coursesData?.courses || [];
  const participants = participantsData?.participants || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseOutput | null>(null);
  const [importingCourse, setImportingCourse] = useState<CourseOutput | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

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

  const handleSortByChange = (value: 'startDate' | 'createdAt') => {
    navigate({
      search: (prev) => ({ ...prev, sortBy: value, page: 1 }),
    });
  };

  const handleOrderChange = (value: 'asc' | 'desc') => {
    navigate({
      search: (prev) => ({ ...prev, order: value, page: 1 }),
    });
  };

  const handleCreate = async (data: CreateCourseInput) => {
    await createMutation.mutateAsync(data);
    setShowAddModal(false);
    refetch();
  };

  const handleUpdate = async (data: CreateCourseInput) => {
    if (!editingCourse) return;
    await updateMutation.mutateAsync({
      courseId: editingCourse.id,
      data,
    });
    setEditingCourse(null);
    refetch();
  };

  const handleDelete = (courseId: string) => {
    setDeleteConfirmationId(courseId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmationId) {
      await deleteMutation.mutateAsync(deleteConfirmationId);
      setDeleteConfirmationId(null);
      refetch();
    }
  };

  const handleEdit = (course: CourseOutput) => {
    setEditingCourse(course);
  };

  const courseFields = event.courseFields || [];

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance">Courses</h1>
            <p className="text-gray-600">
              Manage courses for {event.name}
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <ClockPlus className="inline mr-2 h-5" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CourseFilters
        currentSearch={search.search}
        currentSortBy={search.sortBy}
        currentOrder={search.order}
        onSearchChange={handleSearchChange}
        onSortByChange={handleSortByChange}
        onOrderChange={handleOrderChange}
      />

      {/* Course List */}
      <CourseList
        courses={courses}
        courseFields={courseFields}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImport={setImportingCourse}
      />

      {/* Pagination */}
      <Pagination
        page={coursesData?.page || 1}
        totalPages={coursesData?.totalPages || 1}
        onPageChange={handlePageChange}
      />

      {/* Add Course Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Course"
      >
        <CourseForm
          eventId={eventId}
          courseFields={courseFields}
          salles={halls}
          onSubmit={handleCreate}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Course Modal */}
      {editingCourse && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCourse(null)}
          title="Edit Course"
        >
          <CourseForm
            eventId={eventId}
            courseFields={courseFields}
            salles={halls}
            initialData={{
              courseFields: editingCourse.courseFields,
              startDate: editingCourse.startDate,
              endDate: editingCourse.endDate,
              hallIds: editingCourse.halls?.map((h) => h.hall.id) || [],
              requiresRegistration: editingCourse.requiresRegistration,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCourse(null)}
            submitLabel="Update Course"
          />
        </Modal>
      )}

      {/* Manage Registrations Modal */}
      {importingCourse && (
        <Modal
          isOpen={true}
          onClose={() => setImportingCourse(null)}
          title={`Manage Registrations for ${importingCourse.courseFields?.name || 'Course'}`}
        >
          <ManageRegistrationsForm
            courseId={importingCourse.id}
            eventId={importingCourse.eventId}
            participants={participants}
            participantFields={event.participantFields || []}
            onSuccess={() => {
              // setImportingCourse(null); // Keep open or close? Let the user close.
              refetch();
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Delete Course"
        description="Are you sure you want to delete this course? This action cannot be undone and will remove all participant registrations."
        confirmLabel="Delete Course"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}


