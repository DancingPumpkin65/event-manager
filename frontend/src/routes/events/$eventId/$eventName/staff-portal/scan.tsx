import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Button, Card, Input, Select } from '@/components/ui'
import { Calendar, CheckCircle, Landmark, Presentation, ScanBarcode, XCircle, Camera } from 'lucide-react'
import type { Html5QrcodeScanner as Html5QrcodeScannerType } from 'html5-qrcode'
import type { CourseOutput } from '@/features/course/types'
import { toast } from 'sonner'

export const Route = createFileRoute('/events/$eventId/$eventName/staff-portal/scan')({
  component: DataEntryPage,
})

function DataEntryPage() {
  const { eventId } = Route.useParams()

  const [step, setStep] = useState<'config' | 'entry'>('config')
  const [selectedHallId, setSelectedHallId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [barcode, setBarcode] = useState('')
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; participant?: any } | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: halls = [] } = useQuery({
    queryKey: ['halls', eventId],
    queryFn: () => apiClient.listHallsForEvent(eventId),
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses', eventId],
    queryFn: () => apiClient.listCourses(eventId, 1, 1000), // Get all courses for dropdown
  })

  const allCourses = coursesData?.courses || []

  const courses = selectedHallId
    ? allCourses.filter(course =>
      !course.halls?.length ||
      course.halls.some(h => h.hall.id === selectedHallId)
    )
    : allCourses
  const selectedHallName = halls.find(h => h.id === selectedHallId)?.hallFields?.name || 'Unknown Hall'
  const selectedCourse = allCourses.find(c => c.id === selectedCourseId)
  const getCourseLabel = (course: CourseOutput) => {
    if (!course) return ''
    const fields = course.courseFields || {}
    const timeRange = `${new Date(course.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} > ${new Date(course.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    return `${fields.name || 'Course'} (${timeRange})`
  }
  const selectedCourseName = selectedCourse ? getCourseLabel(selectedCourse) : 'Unknown Period'

  const checkInMutation = useMutation({
    mutationFn: async (input: { barcode: string }) => {
      const response = await apiClient.createAttendance({
        badgeId: input.barcode,
        eventId,
        courseId: selectedCourseId,
        hallId: selectedHallId,
      })

      return response
    },
    onSuccess: ({ attendance, message }) => {
      const isDuplicate = message.includes('Already scanned');

      setScanResult({
        success: !isDuplicate,
        message: message,
        participant: attendance.participant
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setScanResult(null)
        // If scanner is open, we can keep it open or close it. 
        // For continuous scanning, keep it open but maybe pause briefly?
        // Html5QrcodeScanner handles duplicate scanning prevention (via fps/qrbox config often),
        // but here we just want to clear the result message.
      }, 3000)
    },
    onError: (error: any) => {
      setScanResult({
        success: false,
        message: error.message || 'Failed to record attendance'
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setScanResult(null), 3000)
    }
  })

  const handleStartEntry = () => {
    if (selectedHallId && selectedCourseId && selectedDate) {
      setStep('entry')
    }
  }

  const handleReset = () => {
    setStep('config')
    setScanResult(null)
    setBarcode('')
  }

  useEffect(() => {
    if (selectedHallId && !courses.find(c => c.id === selectedCourseId)) {
      setSelectedCourseId('')
    }
  }, [selectedHallId, courses, selectedCourseId])

  useEffect(() => {
    if (step === 'entry' && barcode.length > 5 && !checkInMutation.isPending) {
      const handler = setTimeout(() => {
        handleSubmit()
      }, 500)
      return () => clearTimeout(handler)
    }
  }, [barcode, step])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!barcode.trim() || checkInMutation.isPending) return

    checkInMutation.mutate({ barcode })
    setBarcode('')

    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  useEffect(() => {
    if (step === 'entry' && showScanner) {
      let scanner: Html5QrcodeScannerType | null = null;
      let isMounted = true;

      // Dynamically import html5-qrcode only when scanner is needed
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        if (!isMounted) return;

        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 300, height: 150 }, // Rectangular box for barcodes
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            // Success callback
            // Prevent multiple triggers if currently processing
            if (checkInMutation.isPending) return;

            scanner?.clear().catch(err => console.error("Failed to clear scanner", err));
            setShowScanner(false);

            // Mutate immediately
            checkInMutation.mutate({ barcode: decodedText });

            // Clear input and refocus, matching manual entry behavior
            setBarcode('');
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          },
          (errorMessage) => {
            toast.error(errorMessage);
          }
        );
      }).catch(err => {
        console.error("Failed to load scanner:", err);
        toast.error("Failed to load barcode scanner");
      });

      return () => {
        isMounted = false;
        scanner?.clear().catch(err => {
          // Ignore error if scanner is already cleared
          console.warn("Failed to cleanup scanner", err);
        });
      };
    }
  }, [step, showScanner]) // Re-run if step or showScanner changes (but step check is redundant due to conditional render)

  useEffect(() => {
    if (step === 'entry') {
      // Create a focus handler that keeps focus on input unless we clicked a button or scanner
      const handleFocus = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isClickable = target.tagName === 'BUTTON' || target.closest('button') || target.closest('#reader');

        if (!isClickable && !showScanner) {
          inputRef.current?.focus()
        }
      }
      window.addEventListener('click', handleFocus)
      return () => window.removeEventListener('click', handleFocus)
    }
  }, [step, showScanner])

  if (step === 'config') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-balance">Data Entry</h2>
          <p className="text-gray-500">Ready to scan barcodes</p>
        </div>

        <div className="space-y-6">
          <Select
            label="Select Hall"
            value={selectedHallId}
            onChange={(e) => setSelectedHallId(e.target.value)}
            options={halls.map(hall => ({
              value: hall.id,
              label: hall.hallFields?.name || `Hall ${hall.id.substring(0, 8)}`
            }))}
            placeholder="Select a hall..."
            required
          />

          <Select
            label="Select Course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            options={courses.map(course => ({
              value: course.id,
              label: getCourseLabel(course)
            }))}
            placeholder={selectedHallId ? "Select a period..." : "Select a hall first..."}
            required
            disabled={!selectedHallId}
          />

          <Input
            label="Date"
            type="date"
            value={selectedDate}
            required
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleStartEntry}
            disabled={!selectedHallId || !selectedCourseId || !selectedDate}
            size="lg"
          >
            Start
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-balance">Data Entry</h2>
          <p className="text-gray-500">Ready to scan barcodes</p>
        </div>
        <Button variant="secondary" onClick={handleReset} size="sm">
          Change Configuration
        </Button>
      </div>

      {/* Configuration Summary - Read Only */}
      <Card className="bg-gray-50 border-gray-200">
        <Card.Body className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="flex items-end text-sm font-semibold text-gray-500 uppercase mb-2"><Landmark className="mr-2" aria-hidden="true" /> Hall</span>
            <div className="text-gray-900 font-medium">{selectedHallName}</div>
          </div>
          <div>
            <span className="flex items-end text-sm font-semibold text-gray-500 uppercase mb-2"><Presentation className="mr-2" aria-hidden="true" /> Period</span>
            <div className="text-gray-900 font-medium">{selectedCourseName}</div>
          </div>
          <div>
            <span className="flex items-end text-sm font-semibold text-gray-500 uppercase mb-2"><Calendar className="mr-2" aria-hidden="true" /> Date</span>
            <div className="text-gray-900 font-medium tabular-nums">{new Date(selectedDate).toLocaleDateString()}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Input Area */}
      <Card className={scanResult?.success ? 'border-green-500 ring-1 ring-green-500' : ''}>
        <Card.Body className="py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="barcode" className="text-sm font-medium text-gray-700">Code (Barcode)</label>
              {checkInMutation.isPending && <span className="text-xs text-blue-600 animate-pulse" role="status" aria-live="polite">Processing...</span>}
            </div>

            <form onSubmit={handleSubmit}>
              <Input
                id="barcode"
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full text-3xl font-mono p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-wider tabular-nums"
                placeholder="Type Barcode..."
                autoComplete="off"
                minLength={12}
                autoFocus
                leftIcon={<ScanBarcode className="size-6 text-gray-400" aria-hidden="true" />}
              />
            </form>

            {showScanner && (
              <div className="mb-4 bg-black rounded-lg overflow-hidden" role="region" aria-label="Barcode scanner camera view">
                <div id="reader" className="w-full" aria-label="Camera viewfinder for barcode scanning"></div>
                <div className="text-center p-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowScanner(false)} aria-label="Close camera scanner">
                    Close Camera
                  </Button>
                </div>
              </div>
            )}

            {!showScanner && (
              <div className="text-center mb-4">
                <Button
                  onClick={() => setShowScanner(true)}
                  variant="secondary"
                  leftIcon={<Camera className="size-6 shrink-0" aria-hidden="true" />}
                  className="w-full text-3xl font-mono p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-wider">
                  Scan Barcode
                </Button>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Result Display */}
      {scanResult && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${scanResult.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}
          role="alert"
          aria-live="polite"
        >
          {scanResult.success ? (
            <CheckCircle className="size-8 shrink-0 text-green-600" aria-hidden="true" />
          ) : (
            <XCircle className="size-8 shrink-0 text-red-600" aria-hidden="true" />
          )}
          <div>
            <h4 className="font-bold text-lg text-balance">
              {scanResult.success ? 'Checked In' : 'Error'}
            </h4>
            <p>{scanResult.message}</p>
            {scanResult.participant && (
              <div className="mt-1 text-sm font-medium">
                {scanResult.participant.participantFields?.fullName ||
                  `${scanResult.participant.participantFields?.firstName} ${scanResult.participant.participantFields?.lastName}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
