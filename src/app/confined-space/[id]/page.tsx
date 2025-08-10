
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { ConfinedSpacePermit, Area } from '@/types';
import { Printer, Clock, User, Box, FileSignature, CheckSquare, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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


export default function ConfinedSpacePermitPrintPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { confinedSpacePermits, brandingSettings, areas } = useAppData();
    const [permit, setPermit] = useState<ConfinedSpacePermit | null | undefined>(undefined);
    
    useEffect(() => {
        if (id) {
            const foundPermit = confinedSpacePermits.find(p => p.permit_id === id);
            setPermit(foundPermit);
        }
    }, [id, confinedSpacePermits]);
    
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
                    {brandingSettings?.logoUrl && <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain mx-auto mb-4" data-ai-hint="logo" />}
                    <h1 className="text-3xl font-bold">Confined Space Entry Permit</h1>
                    <p className="text-sm text-gray-500 mt-1">Permit ID: {permit.display_id}</p>
                </header>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm p-4 border rounded-lg">
                    <div><strong className="font-semibold block text-gray-700">Location:</strong> {areaPath}</div>
                    <div><strong className="font-semibold block text-gray-700">Supervisor:</strong> {permit.supervisor}</div>
                    <div className="col-span-2"><strong className="font-semibold block text-gray-700">Work Description:</strong> {permit.work_description}</div>
                    <div><strong className="font-semibold block text-gray-700">Permit Issued:</strong> {permit.supervisor_signature ? format(new Date(permit.supervisor_signature.date), "P p") : 'Not Issued'}</div>
                    <div><strong className="font-semibold block text-gray-700">Permit Expires:</strong> {format(new Date(permit.permit_expires), "P p")}</div>
                    <div className="col-span-2"><strong className="font-semibold block text-gray-700">Entrants:</strong> {permit.entrants}</div>
                </div>

                <h2 className="text-xl font-bold mb-2 border-b pb-2">Safety Checklist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 text-sm">
                    <div className="space-y-2">
                        <ChecklistItemRow label="Isolation and blinding complete" status={permit.checklist.isolation_and_blinding_complete} />
                        <ChecklistItemRow label="Equipment cleaned/purged" status={permit.checklist.cleaning_and_purging_complete} />
                        <ChecklistItemRow label="Adequate ventilation" status={permit.checklist.ventilation_adequate} />
                    </div>
                    <div className="space-y-2">
                        <ChecklistItemRow label="Standby person present" status={permit.checklist.standby_person_present} />
                        <ChecklistItemRow label="Rescue equipment ready" status={permit.checklist.rescue_equipment_ready} />
                        <ChecklistItemRow label="Communication established" status={permit.checklist.communication_established} />
                    </div>
                </div>

                <h2 className="text-xl font-bold mt-6 mb-2 border-b pb-2">Atmospheric Testing</h2>
                <ChecklistItemRow label="Atmospheric testing acceptable" status={permit.checklist.atmospheric_testing_ok} />
                {permit.checklist.atmospheric_testing_ok === 'Yes' && (
                    <div className="grid grid-cols-3 gap-4 mt-2 text-center p-2 border rounded-md">
                        <div><p className="text-xs font-semibold">Oxygen</p><p>{permit.checklist.oxygen_level}</p></div>
                        <div><p className="text-xs font-semibold">Combustibles</p><p>{permit.checklist.combustible_gases_level}</p></div>
                        <div><p className="text-xs font-semibold">Toxic Gases</p><p>{permit.checklist.toxic_gases_level}</p></div>
                    </div>
                )}
                
                {permit.special_instructions && (
                  <>
                    <h2 className="text-xl font-bold mt-6 mb-2 border-b pb-2">Special Instructions</h2>
                    <p className="text-sm p-3 border rounded-md bg-gray-50">{permit.special_instructions}</p>
                  </>
                )}


                <h2 className="text-xl font-bold mt-8 mb-2 border-b pb-2">Signatures & Close-out</h2>
                <div className="grid grid-cols-2 gap-8">
                     <div>
                        <h3 className="font-semibold">Entrant Sign-off (Work Complete)</h3>
                        {permit.entrant_signature ? (
                           <div className="mt-2 p-2 border rounded-md">
                             <p className="font-mono">{permit.entrant_signature.name}</p>
                             <p className="text-xs text-gray-500">Signed on {format(new Date(permit.entrant_signature.date), 'PPP')}</p>
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

