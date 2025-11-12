import { PrintBadgeButton } from '@/components/PrintBadgeButton';
import { useAuth } from '@/context/AuthContext';
import type { Staff } from '../types';
import { SquarePen, Trash2, UserPen, UserX } from 'lucide-react';
import { Button } from '@/components/ui';

interface StaffListProps {
  staff: Staff[];
  onEdit: (staff: Staff) => void;
  onDelete: (id: string) => void;
  onBadgePrintSuccess: () => void;
  isDeleting?: boolean;
}

export default function StaffList({
  staff,
  onEdit,
  onDelete,
  onBadgePrintSuccess,
  isDeleting = false,
}: StaffListProps) {
  const { user, isAdmin } = useAuth();

  if (staff.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new staff member.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Mobile: Card view */}
      <div className="block md:hidden divide-y divide-gray-200">
        {staff.map((member) => (
          <div key={member.id} className="p-4 hover:bg-gray-50">
            <div className="space-y-2">
              {/* Name */}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900 text-right ml-2">
                  {member.staffFields?.firstName || ''} {member.staffFields?.lastName || ''}
                </span>
              </div>

              {/* Email */}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="text-gray-900 text-right ml-2 break-words max-w-[60%]">
                  {member.staffFields?.email || '-'}
                </span>
              </div>

              {/* Username */}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Username:</span>
                <span className="text-gray-900 text-right ml-2">
                  {member.username}
                </span>
              </div>

              {/* Badge Status */}
              <div className="pt-2 border-t border-gray-100">
                <PrintBadgeButton
                  id={member.id}
                  type="staff"
                  badgePrintedAt={member.badgePrintedAt}
                  badgePrintedBy={member.badgePrintedBy}
                  printedBy={(user as any)?.email || 'Unknown'}
                  onPrintSuccess={onBadgePrintSuccess}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-2 pt-2">
                <Button className='w-full' size='sm' onClick={() => onEdit(member)} leftIcon={<UserPen className="inline mr-2" />}>
                  Edit
                </Button>
                {isAdmin && (
                  <Button variant='danger' className='w-full' size='sm' onClick={() => onDelete(member.id)} disabled={isDeleting} leftIcon={<UserX className="inline mr-2" />}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Badge Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {member.staffFields?.firstName || ''} {member.staffFields?.lastName || ''}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                  {member.staffFields?.email || ''}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                  {member.username}
                </td>

                {/* Badge Status Column */}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <PrintBadgeButton
                    id={member.id}
                    type="staff"
                    badgePrintedAt={member.badgePrintedAt}
                    badgePrintedBy={member.badgePrintedBy}
                    printedBy={(user as any)?.email || 'Unknown'}
                    onPrintSuccess={onBadgePrintSuccess}
                  />
                </td>

                {/* Actions Column */}
                <td className="whitespace-nowrap text-right px-3 py-4 text-sm space-x-1">
                  <Button className='!px-1 !border-none' variant='secondary' size="sm" onClick={() => onEdit(member)}>
                    <SquarePen className="h-5" />
                  </Button>
                  {isAdmin && (
                    <Button className='!px-1 !border-none' variant='danger' size="sm" onClick={() => onDelete(member.id)} disabled={isDeleting}>
                      <Trash2 className="h-5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
