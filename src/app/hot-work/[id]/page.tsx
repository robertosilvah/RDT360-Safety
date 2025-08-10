
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/context/AppDataContext';
import type { HotWorkPermit, Area } from '@/types';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const findAreaPathById = (areas: Area[], id: string, path: string[] = []): string => {
    for (const area of areas) {
        const newPath = [...path, area.name];
        if (area.area_id === id) {
            return newPath.join(' / ');
        }
        if (area.children) {
            const foundPath = findAreaPathById(area.children, id, newPath);
            if (foundPath) return foundPath;
        }
    }
    return '';
};

const ChecklistItemRow = ({ label, status }: { label: string, status: string }) => (
    <div className="flex justify-between items-center py-2 border-b">
        <p>{label}</p>
        <Badge variant={status === 'Yes' ? 'default' : status === 'No' ? 'destructive' : 'secondary'}>{status}</Badge>
    </div>
);

export default function HotWorkPermitPrintPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { hotWorkPermits, brandingSettings, areas } = useAppData();
    const [permit, setPermit] = useState<HotWorkPermit | null | undefined>(undefined);
    
    useEffect(() => {
        if (id) {
            const foundPermit = hotWorkPermits.find(p => p.permit_id === id);
            setPermit(foundPermit);
        }
    }, [id, hotWorkPermits]);
    
    if (permit === undefined) {
        return <div className="flex items-center justify-center h-screen"><Skeleton className="h-96 w-full max-w-4xl" /></div>;
    }
    
    if (permit === null) {
        notFound();
    }
    
    const handlePrint = () => {
        window.print();
    };

    const areaPath = findAreaPathById(areas, permit.areaId);
    
    return (
        <div className="bg-white text-black min-h-screen">
            <header className="p-8 flex justify-between items-center no-print">
                <h1 className="text-2xl font-bold">Print Preview</h1>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Permit</Button>
            </header>
            <main className="p-8 printable-area">
                 <header className="mb-8 text-center">
                    {brandingSettings?.logoUrl && <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain mx-auto mb-4" data-ai-hint="logo"/>}
                    <h1 className="text-3xl font-bold">Hot Work Permit</h1>
                    <p className="text-sm text-gray-500 mt-1">Permit ID: {permit.display_id}</p>
                </header>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm p-4 border rounded-lg">
                    <div><strong className="font-semibold block text-gray-700">Location:</strong> {areaPath}</div>
                    <div><strong className="font-semibold block text-gray-700">Supervisor:</strong> {permit.supervisor}</div>
                    <div className="col-span-2"><strong className="font-semibold block text-gray-700">Work Performed By:</strong> {permit.work_to_be_performed_by} ({permit.performed_by_type})</div>
                    <div><strong className="font-semibold block text-gray-700">Permit Issued:</strong> {permit.supervisor_signature ? format(new Date(permit.supervisor_signature.date), "P p") : 'Not Issued'}</div>
                    <div><strong className="font-semibold block text-gray-700">Permit Expires:</strong> {format(new Date(permit.permit_expires), "P p")}</div>
                </div>

                <h2 className="text-xl font-bold mb-2 border-b pb-2">Safety Checklist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-sm">
                    <div className="space-y-2">
                        <h3 className="font-semibold">Precautions</h3>
                        <ChecklistItemRow label="Fire extinguisher available" status={permit.checklist.fire_extinguisher} />
                        <ChecklistItemRow label="Equipment in good repair" status={permit.checklist.equipment_good_repair} />
                        <ChecklistItemRow label="Hazardous energy locked out" status={permit.checklist.energy_locked_out} />
                    </div>
                     <div className="space-y-2">
                        <h3 className="font-semibold">Requirements within 35 ft.</h3>
                        <ChecklistItemRow label="Flammables removed" status={permit.checklist.flammables_removed} />
                        <ChecklistItemRow label="Floors swept clean" status={permit.checklist.floors_swept} />
                        <ChecklistItemRow label="Fire-resistive covers used" status={permit.checklist.fire_resistive_covers} />
                        <ChecklistItemRow label="Openings covered" status={permit.checklist.openings_covered} />
                        <ChecklistItemRow label="Walls/ceilings protected" status={permit.checklist.walls_ceilings_protected} />
                    </div>
                </div>
                 <div className="mt-4">
                    <h3 className="font-semibold">Fire Watch</h3>
                    <ChecklistItemRow label="Fire Watch required" status={permit.fire_watch_required} />
                    {permit.fire_watch_required === 'Yes' && <ChecklistItemRow label="Fire Watch provided" status={permit.checklist.fire_watch_provided} />}
                </div>

                <h2 className="text-xl font-bold mt-8 mb-2 border-b pb-2">Signatures & Close-out</h2>
                <div className="grid grid-cols-2 gap-8">
                     <div>
                        <h3 className="font-semibold">Employee Sign-off (Work Complete)</h3>
                        {permit.employee_signature ? (
                           <div className="mt-2 p-2 border rounded-md">
                             <p className="font-mono">{permit.employee_signature.name}</p>
                             <p className="text-xs text-gray-500">Signed on {format(new Date(permit.employee_signature.date), 'PPP')}</p>
                           </div>
                        ): <div className="mt-2 p-8 border-dashed border-2 h-24"></div>}
                    </div>
                    <div>
                        <h3 className="font-semibold">Supervisor Sign-off (Permit Closed)</h3>
                        {permit.final_supervisor_signature ? (
                            <div className="mt-2 p-2 border rounded-md">
                                <p className="font-mono">{permit.final_supervisor_signature.name}</p>
                                <p className="text-xs text-gray-500">Signed on {format(new Date(permit.final_supervisor_signature.date), 'PPP')}</p>
                            </div>
                        ): <div className="mt-2 p-8 border-dashed border-2 h-24"></div>}
                    </div>
                </div>
            </main>
        </div>
    );
}

