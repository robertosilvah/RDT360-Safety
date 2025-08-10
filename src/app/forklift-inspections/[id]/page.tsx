
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/context/AppDataContext';
import type { ForkliftInspection } from '@/types';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ForkliftInspectionPrintPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { forkliftInspections, brandingSettings } = useAppData();
    const [inspection, setInspection] = useState<ForkliftInspection | null | undefined>(undefined);
    
    useEffect(() => {
        if (id) {
            const foundInspection = forkliftInspections.find(i => i.inspection_id === id);
            setInspection(foundInspection);
        }
    }, [id, forkliftInspections]);
    
    if (inspection === undefined) {
        return <div className="flex items-center justify-center h-screen"><Skeleton className="h-96 w-full max-w-4xl" /></div>;
    }
    
    if (inspection === null) {
        notFound();
    }
    
    const handlePrint = () => {
        window.print();
    };

    const statusVariant: { [key in 'Pass' | 'Fail' | 'N/A']: 'outline' | 'destructive' | 'secondary' } = {
        'Pass': 'outline',
        'Fail': 'destructive',
        'N/A': 'secondary',
    };

    return (
        <div className="bg-white text-black min-h-screen">
            <header className="p-8 flex justify-between items-center no-print">
                <h1 className="text-2xl font-bold">Print Preview</h1>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Inspection</Button>
            </header>
            <main className="p-8 printable-area">
                 <header className="mb-8 text-center">
                    {brandingSettings?.logoUrl && <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain mx-auto mb-4" data-ai-hint="logo" />}
                    <h1 className="text-3xl font-bold">Forklift Pre-Use Inspection</h1>
                    <p className="text-sm text-gray-500 mt-1">Inspection ID: {inspection.display_id}</p>
                </header>

                <div className="grid grid-cols-3 gap-4 mb-6 text-sm p-4 border rounded-lg">
                    <div><strong className="font-semibold block text-gray-700">Forklift ID:</strong> {inspection.forklift_id}</div>
                    <div><strong className="font-semibold block text-gray-700">Operator:</strong> {inspection.operator_name}</div>
                    <div><strong className="font-semibold block text-gray-700">Date:</strong> {format(new Date(inspection.date), "P p")}</div>
                </div>

                <h2 className="text-xl font-bold mb-2 border-b pb-2">Checklist Results</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Item</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Comment / Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inspection.checklist.map((item) => (
                            <TableRow key={item.id} className="break-inside-avoid">
                                <TableCell className="align-top">{item.question}</TableCell>
                                <TableCell className="align-top"><Badge variant={statusVariant[item.status]}>{item.status}</Badge></TableCell>
                                <TableCell className="align-top">
                                    {item.comment || 'N/A'}
                                    {item.actionId && (
                                        <p className="font-semibold">Action Created</p>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                 <div className="mt-12">
                    <h2 className="text-xl font-bold mb-2 border-b pb-2">Operator Signature</h2>
                    <div className="border-b-2 pb-2">
                        <p className="font-mono text-lg">{inspection.operator_name}</p>
                        <p className="text-xs text-gray-500">Electronically signed on {format(new Date(inspection.date), 'PPP p')}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

