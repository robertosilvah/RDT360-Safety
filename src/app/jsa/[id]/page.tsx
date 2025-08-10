
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { JSA } from '@/types';
import { Clock, User, MapPin, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import api from '@/services/backend';

const findAreaPathById = (areas: any[], id: string, path: string[] = []): string => {
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


export default function JsaPrintPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { jsas, brandingSettings, areas } = useAppData();
    const [jsa, setJsa] = useState<JSA | null | undefined>(undefined);
    
    useEffect(() => {
        if (id) {
            const foundJsa = jsas.find(j => j.jsa_id === id);
            setJsa(foundJsa);
        }
    }, [id, jsas]);
    
    if (jsa === undefined) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Skeleton className="h-96 w-full max-w-4xl" />
            </div>
        );
    }
    
    if (jsa === null) {
        notFound();
    }
    
    const handlePrint = () => {
        window.print();
    };

    const areaPath = findAreaPathById(areas, jsa.areaId);

    const riskMatrix: { [key in JSA['steps'][0]['severity']]: { [key in JSA['steps'][0]['likelihood']]: string } } = {
        'Low': { 'Unlikely': 'bg-green-500', 'Possible': 'bg-green-500', 'Likely': 'bg-yellow-500', 'Certain': 'bg-yellow-500' },
        'Medium': { 'Unlikely': 'bg-green-500', 'Possible': 'bg-yellow-500', 'Likely': 'bg-yellow-500', 'Certain': 'bg-red-500' },
        'High': { 'Unlikely': 'bg-yellow-500', 'Possible': 'bg-red-500', 'Likely': 'bg-red-300', 'Certain': 'bg-red-300' },
        'Critical': { 'Unlikely': 'bg-red-300', 'Possible': 'bg-red-300', 'Likely': 'bg-red-300', 'Certain': 'bg-red-300' },
    };
    
    return (
        <div className="bg-white text-black min-h-screen">
            <header className="p-8 flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold">Print Preview</h1>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print JSA</Button>
            </header>
            <main className="p-8">
                 <header className="mb-8 text-center">
                    {brandingSettings?.logoUrl && <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain mx-auto mb-4" />}
                    <h1 className="text-3xl font-bold">{jsa.title}</h1>
                    <p className="text-lg text-gray-600">{jsa.job_description}</p>
                    <p className="text-sm text-gray-500 mt-1">JSA ID: {jsa.display_id}</p>
                </header>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div><strong className="font-semibold">Area/Operation:</strong> {areaPath}</div>
                    <div><strong className="font-semibold">Permit Validity:</strong> {format(new Date(jsa.valid_from), "P p")} to {format(new Date(jsa.valid_to), "P p")}</div>
                    <div className="col-span-2"><strong className="font-semibold">Required PPE:</strong> {jsa.required_ppe.join(', ')}</div>
                </div>

                <h2 className="text-xl font-bold mb-2 border-b pb-2">Job Steps, Hazards, and Controls</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[20%]">Step</TableHead>
                            <TableHead className="w-[15%]">Principal Hazard</TableHead>
                            <TableHead className="w-[15%]">Potential Hazards</TableHead>
                            <TableHead className="w-[15%]">Control Measures</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead>Tasks</TableHead>
                            <TableHead className="w-[15%]">Comments</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jsa.steps.map((step, index) => (
                            <TableRow key={index} className="break-inside-avoid">
                                <TableCell className="font-semibold align-top">{index + 1}. {step.step_description}</TableCell>
                                <TableCell className="align-top">{step.principal_hazard}</TableCell>
                                <TableCell className="align-top">{step.hazards.join(', ')}</TableCell>
                                <TableCell className="align-top">{step.controls.join(', ')}</TableCell>
                                <TableCell className="align-top">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-4 w-4 rounded-full border border-black", riskMatrix[step.severity]?.[step.likelihood])} />
                                        <div>
                                            <p>S: {step.severity}</p>
                                            <p>L: {step.likelihood}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="align-top">{step.tasks}</TableCell>
                                <TableCell className="align-top">{step.comments}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-12">
                    <h2 className="text-xl font-bold mb-2 border-b pb-2">Signatures ({jsa.signatures.length})</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {jsa.signatures.length > 0 ? jsa.signatures.map((sig, index) => (
                            <div key={index} className="border-b-2 pb-2">
                                <p className="font-mono">{sig.employee_name}</p>
                                <p className="text-xs text-gray-500">Signed on {format(new Date(sig.sign_date), 'PPP')}</p>
                            </div>
                        )) : <p>No signatures yet.</p>}
                    </div>
                </div>
            </main>
        </div>
    );
}
