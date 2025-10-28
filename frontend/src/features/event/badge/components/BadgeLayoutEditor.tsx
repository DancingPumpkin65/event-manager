import { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import {
    type BadgeLayoutConfig,
    type BadgeTextElement,
    type PaperSize,
    PAPER_DIMENSIONS,
    DEFAULT_BADGE_LAYOUT,
    loadLayoutConfig,
    saveLayoutConfig,
    generateElementId,
} from '@/lib/badge-layout-types';
import { Button } from '@/components/ui';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { ParticipantFieldDefinition } from '@/features/event/types';
import { Save, RotateCcw, Plus } from 'lucide-react';

interface BadgeLayoutEditorProps {
    participantFields?: ParticipantFieldDefinition[];
    staffFields?: ParticipantFieldDefinition[];
    initialConfig?: BadgeLayoutConfig | null;
    onSave?: (config: BadgeLayoutConfig) => void;
}

// Sample participant data for preview - dynamically generated
const generateSampleData = (participantFields: ParticipantFieldDefinition[], staffFields: ParticipantFieldDefinition[]): Record<string, any> => {
    const sample: Record<string, any> = {};

    // Helper to generate values
    const addFields = (fields: ParticipantFieldDefinition[], prefix: string = '') => {
        fields.forEach(field => {
            const key = prefix ? `${prefix}.${field.name}` : field.name;
            switch (field.type) {
                case 'email':
                    sample[key] = prefix ? 'staff@example.com' : 'participant@example.com';
                    break;
                case 'phone':
                    sample[key] = '+212 600 000 000';
                    break;
                case 'number':
                    sample[key] = '12345';
                    break;
                case 'date':
                    sample[key] = '2024-01-01';
                    break;
                case 'checkbox':
                    sample[key] = 'Yes';
                    break;
                case 'select':
                    sample[key] = field.options?.[0] || 'Option';
                    break;
                default:
                    // Use label as sample value for text fields
                    sample[key] = (field.label || field.name).toUpperCase();
            }
        });
    };

    addFields(participantFields);
    addFields(staffFields, 'staff');

    return sample;
};

export default function BadgeLayoutEditor({
    participantFields = [],
    staffFields = [],
    initialConfig,
    onSave
}: BadgeLayoutEditorProps) {
    const [config, setConfig] = useState<BadgeLayoutConfig>(() => {
        if (initialConfig) return initialConfig;
        return loadLayoutConfig();
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    // Generate dynamic sample data based on participantFields and staffFields
    const sampleParticipant = generateSampleData(participantFields, staffFields);

    // Get current paper dimensions
    const paperDims = PAPER_DIMENSIONS[config.paperSize];

    // Scale factor for preview - Use exact mm to pixels conversion (1mm ≈ 3.78px at 96dpi)
    // But scale down to fit the preview area
    const maxPreviewWidth = 350;
    const scale = maxPreviewWidth / paperDims.width;
    const previewWidth = paperDims.width * scale;
    const previewHeight = paperDims.height * scale;

    // Available fields for dropdown - dynamically from event fields
    const availableFields = [
        // Add participant fields
        ...participantFields.map(f => ({ value: f.name, label: f.label })),
        // Add staff fields with prefix
        ...staffFields.map(f => ({ value: `staff.${f.name}`, label: `Staff: ${f.label}` })),
        // Add combination option for name-like fields
        ...(participantFields.some(f => f.name === 'firstName' || f.name === 'prenom') &&
            participantFields.some(f => f.name === 'lastName' || f.name === 'nom')
            ? [{ value: 'firstName,lastName', label: 'Full Name (First + Last)' }]
            : []),
        // Add fullName if it exists
        ...(participantFields.some(f => f.name.toLowerCase().includes('fullname') || f.name.toLowerCase().includes('nom_complet'))
            ? []  // It's already in participantFields
            : []),
    ];

    // Get field value from sample participant
    const getFieldValue = (fieldName: string): string => {
        if (fieldName.includes(',')) {
            // Combined fields
            return fieldName.split(',').map(f => sampleParticipant[f.trim()] || f.trim()).join(' ');
        }
        return sampleParticipant[fieldName] || `[${fieldName}]`;
    };

    // Draw preview on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions (2x for retina)
        canvas.width = previewWidth * 2;
        canvas.height = previewHeight * 2;
        ctx.scale(2, 2);

        // Clear canvas - white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, previewWidth, previewHeight);

        // Draw border if enabled
        if (config.showBorder) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(5 * scale, 5 * scale, (paperDims.width - 10) * scale, (paperDims.height - 10) * scale);
        }

        // Draw text elements
        config.textElements.forEach(element => {
            const value = getFieldValue(element.fieldName);

            // Font size conversion: jsPDF uses points (pt), canvas uses pixels
            // 1 point = 0.352778 mm
            // Convert pt to mm, then apply scale to get pixels for preview
            const PT_TO_MM = 0.352778;
            const fontSizeMm = element.fontSize * PT_TO_MM;
            const fontSizePx = fontSizeMm * scale;

            ctx.fillStyle = '#000000';
            ctx.font = `${element.fontWeight} ${fontSizePx}px Arial`;
            ctx.textAlign = element.align;

            const x = element.position.x * scale;
            const y = element.position.y * scale;

            ctx.fillText(value, x, y);

            // Draw selection indicator
            if (element.id === selectedElementId) {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
                ctx.lineWidth = 2;
                const textWidth = ctx.measureText(value).width;
                const textHeight = fontSizePx;
                let rectX = x;
                if (element.align === 'center') rectX = x - textWidth / 2;
                else if (element.align === 'right') rectX = x - textWidth;
                ctx.strokeRect(rectX - 4, y - textHeight, textWidth + 8, textHeight + 8);
            }
        });

        // Generate barcode
        try {
            const barcodeCanvas = document.createElement('canvas');
            JsBarcode(barcodeCanvas, 'PART-12345678', {
                format: 'CODE128',
                width: 2,
                height: 50,
                displayValue: false,
                fontSize: 12,
                margin: 5,
                background: '#ffffff',
                lineColor: '#000000',
            });

            // Draw barcode
            ctx.drawImage(
                barcodeCanvas,
                config.barcode.position.x * scale,
                config.barcode.position.y * scale,
                config.barcode.size.width * scale,
                config.barcode.size.height * scale
            );
        } catch (error) {
            console.error('[BadgeLayoutEditor] Barcode generation failed:', error);
        }

        // Draw center guideline
        ctx.strokeStyle = 'rgba(0, 128, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(previewWidth / 2, 0);
        ctx.lineTo(previewWidth / 2, previewHeight);
        ctx.stroke();
        ctx.setLineDash([]);

    }, [config, paperDims, previewWidth, previewHeight, scale, selectedElementId]);

    const updateConfig = <K extends keyof BadgeLayoutConfig>(key: K, value: BadgeLayoutConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const addTextElement = () => {
        // Determine a valid default field name
        const defaultField = participantFields.length > 0 ? participantFields[0].name : 'fullName';

        const newElement: BadgeTextElement = {
            id: generateElementId(),
            fieldName: defaultField,
            label: 'New Text',
            position: { x: paperDims.width / 2, y: 60 },
            fontSize: 12,
            fontWeight: 'normal',
            align: 'center',
        };
        updateConfig('textElements', [...config.textElements, newElement]);
        setSelectedElementId(newElement.id);
    };

    const updateTextElement = (id: string, updates: Partial<BadgeTextElement>) => {
        updateConfig('textElements', config.textElements.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const removeTextElement = (id: string) => {
        updateConfig('textElements', config.textElements.filter(el => el.id !== id));
        if (selectedElementId === id) setSelectedElementId(null);
    };

    const handleSave = () => {
        saveLayoutConfig(config);
        onSave?.(config);
        setSaveMessage('Layout saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_BADGE_LAYOUT);
        setSelectedElementId(null);
        setSaveMessage('Layout reset to defaults');
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const paperSizeOptions = [
        { value: 'A4', label: 'A4 (210 × 297 mm)' },
        { value: 'A6', label: 'A6 (105 × 148 mm)' },
    ];

    const fontWeightOptions = [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
    ];

    const alignOptions = [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
    ];

    const selectedElement = config.textElements.find(el => el.id === selectedElementId);

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Controls Panel */}
            <div className="flex-1 space-y-8">
                {/* Paper Settings */}
                <div className="">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Paper Size"
                            options={paperSizeOptions}
                            value={config.paperSize}
                            onChange={(e) => updateConfig('paperSize', e.target.value as PaperSize)}
                            fullWidth
                        />
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showBorder}
                                    onChange={(e) => updateConfig('showBorder', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Show Border</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Text Elements */}
                <div className="">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-sm text-gray-800">Text Elements</h1>
                        <Button onClick={addTextElement} size="sm" leftIcon={<Plus className="h-5 w-5 mr-2" />}>Add Text</Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {config.textElements.map((element) => (
                            <div
                                key={element.id}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedElementId === element.id ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                onClick={() => setSelectedElementId(element.id)}
                            >
                                <div>
                                    <span className="font-medium text-sm">{element.label}</span>
                                    <span className="text-xs text-gray-500 ml-2">({element.fieldName})</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeTextElement(element.id); }}
                                    className="text-red-500 hover:text-red-700 text-sm px-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {config.textElements.length === 0 && (
                            <p className="text-gray-400 text-sm text-center py-4">No text elements. Click "Add Text" to add one.</p>
                        )}
                    </div>
                </div>

                {/* Selected Element Properties */}
                {selectedElement && (
                    <div className="">
                        <h3 className="text-sm text-gray-700 mb-4">Edit: {selectedElement.label}</h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <Input
                                label="Label"
                                value={selectedElement.label}
                                onChange={(e) => updateTextElement(selectedElement.id, { label: e.target.value })}
                            />
                            <Select
                                label="Field"
                                options={availableFields}
                                value={selectedElement.fieldName}
                                onChange={(e) => updateTextElement(selectedElement.id, { fieldName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <Input
                                    label="X (mm)"
                                    type="number"
                                    value={selectedElement.position.x}
                                    onChange={(e) => updateTextElement(selectedElement.id, {
                                        position: { ...selectedElement.position, x: Number(e.target.value) }
                                    })}
                                    min={0}
                                    max={paperDims.width}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Y (mm)"
                                    type="number"
                                    value={selectedElement.position.y}
                                    onChange={(e) => updateTextElement(selectedElement.id, {
                                        position: { ...selectedElement.position, y: Number(e.target.value) }
                                    })}
                                    min={0}
                                    max={paperDims.height}
                                />
                            </div>
                            <div>
                                <Input
                                    label="Font Size"
                                    type="number"
                                    value={selectedElement.fontSize}
                                    onChange={(e) => updateTextElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                                    min={6}
                                    max={72}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Weight"
                                options={fontWeightOptions}
                                value={selectedElement.fontWeight}
                                onChange={(e) => updateTextElement(selectedElement.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                            />
                            <Select
                                label="Align"
                                options={alignOptions}
                                value={selectedElement.align}
                                onChange={(e) => updateTextElement(selectedElement.id, { align: e.target.value as 'left' | 'center' | 'right' })}
                            />
                        </div>
                    </div>
                )}

                {/* Barcode Settings */}
                <div className="">
                    <h2 className="text-sm text-gray-800 mb-4">Barcode</h2>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <Input
                            label="X (mm)"
                            type="number"
                            value={config.barcode.position.x}
                            onChange={(e) => updateConfig('barcode', {
                                ...config.barcode,
                                position: { ...config.barcode.position, x: Number(e.target.value) }
                            })}
                            min={0}
                            max={paperDims.width}
                        />
                        <Input
                            label="Y (mm)"
                            type="number"
                            value={config.barcode.position.y}
                            onChange={(e) => updateConfig('barcode', {
                                ...config.barcode,
                                position: { ...config.barcode.position, y: Number(e.target.value) }
                            })}
                            min={0}
                            max={paperDims.height}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Width (mm)"
                            type="number"
                            value={config.barcode.size.width}
                            onChange={(e) => updateConfig('barcode', {
                                ...config.barcode,
                                size: { ...config.barcode.size, width: Number(e.target.value) }
                            })}
                            min={20}
                            max={paperDims.width - 20}
                        />
                        <Input
                            label="Height (mm)"
                            type="number"
                            value={config.barcode.size.height}
                            onChange={(e) => updateConfig('barcode', {
                                ...config.barcode,
                                size: { ...config.barcode.size, height: Number(e.target.value) }
                            })}
                            min={10}
                            max={80}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button onClick={handleSave} className="flex-1" leftIcon={<Save className="h-5 w-5 mr-2" />}>Save Layout</Button>
                    <Button onClick={handleReset} variant="secondary" className="flex-1" leftIcon={<RotateCcw className="h-5 w-5 mr-2" />}>Reset</Button>
                </div>

                {saveMessage && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-center text-sm font-medium">
                        {saveMessage}
                    </div>
                )}
            </div>

            {/* Preview Panel - uses content-visibility for performance */}
            <div className="flex-1">
                <div className="card sticky top-6 content-auto-badge">
                    <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        Live Preview
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                        {config.paperSize} ({paperDims.width} × {paperDims.height} mm) — Click elements to select
                    </p>

                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50"
                        style={{ minHeight: previewHeight + 32 }}
                    >
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: previewWidth,
                                height: previewHeight,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        />
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                            <strong>Tip:</strong> Add multiple text elements for different layouts. The same field can appear multiple times on the badge.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
