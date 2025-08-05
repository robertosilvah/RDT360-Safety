
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';
import { JSA, Area } from '@/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Siren, Users, Shield, MapPin, Clock } from 'lucide-react';

const findAreaPathById = (areas: Area[], id: string, path: string[] = []): string => {
    for (const area of areas) {
        const newPath = [...path, area.name];
        if (area.area_id === id) return newPath.join(' / ');
        if (area.children) {
            const foundPath = findAreaPathById(area.children, id, newPath);
            if (foundPath) return foundPath;
        }
    }
    return '';
};

const JsaPrintPage = () => {
    const params = useParams();
    const id = params.id as string;
    const { jsas, areas, brandingSettings } = useAppData();
    const [jsa, setJsa] = useState<JSA | null | undefined>(undefined);

    useEffect(() => {
        if (jsas.length > 0 && areas.length > 0) {
            const foundJsa = jsas.find(j => j.jsa_id === id);
            setJsa(foundJsa || null);
        }
    }, [id, jsas, areas]);
    
    useEffect(() => {
        if (jsa) {
            // Delay print slightly to ensure all content is rendered
            setTimeout(() => window.print(), 500);
        }
    }, [jsa]);

    const areaPath = useMemo(() => {
        if (jsa?.areaId && areas.length > 0) {
            return findAreaPathById(areas, jsa.areaId);
        }
        return jsa?.areaId || 'Loading...';
    }, [jsa, areas]);

    const riskMatrix: { [key in JSA['steps'][0]['severity']]: { [key in JSA['steps'][0]['likelihood']]: string } } = {
        'Low': { 'Unlikely': 'bg-green-300', 'Possible': 'bg-green-300', 'Likely': 'bg-yellow-300', 'Certain': 'bg-yellow-300' },
        'Medium': { 'Unlikely': 'bg-green-300', 'Possible': 'bg-yellow-300', 'Likely': 'bg-yellow-300', 'Certain': 'bg-red-300' },
        'High': { 'Unlikely': 'bg-yellow-300', 'Possible': 'bg-red-300', 'Likely': 'bg-red-300', 'Certain': 'bg-red-300' },
        'Critical': { 'Unlikely': 'bg-red-300', 'Possible': 'bg-red-300', 'Likely': 'bg-red-300', 'Certain': 'bg-red-300' },
    };

    if (jsa === undefined) {
        return (
            <div className="p-8 bg-white">
                <Skeleton className="h-12 w-1/3 mb-4" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (jsa === null) {
        notFound();
    }

    return (
        <div className="bg-white text-black p-8 font-sans">
             <header className="flex justify-between items-start pb-4 border-b">
                <div className="flex items-center gap-4">
                  {brandingSettings?.logoUrl ? (
                    <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain" />
                   ) : (
                    <div className="flex items-center gap-2 text-xl font-bold"><Siren className="w-8 h-8"/> RDT360-Safety</div>
                   )}
                </div>
                <div className="text-right text-xs">
                    <p><strong>JSA ID:</strong> {jsa.display_id}</p>
                    <p><strong>Created:</strong> {format(new Date(jsa.created_date), 'P')}</p>
                </div>
            </header>

            <div className="text-center my-6">
              <h1 className="text-3xl font-bold">Job Safety Analysis</h1>
            </div>

            <section className="space-y-4 mb-6">
                <h2 className="text-xl font-bold border-b pb-2">JSA Details</h2>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <h3 className="font-semibold">JSA Title</h3>
                        <p>{jsa.title}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Job Description</h3>
                        <p>{jsa.job_description}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><MapPin size={16}/> Area / Operation</h3>
                        <p>{areaPath}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><Clock size={16}/> Permit Validity</h3>
                        <p>{format(new Date(jsa.valid_from), "P p")} to {format(new Date(jsa.valid_to), "P p")}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><Shield size={16}/> Required PPE</h3>
                        <div className="flex flex-wrap gap-2 pt-1">{jsa.required_ppe.map((item, index) => <Badge key={index} variant="secondary" className="bg-gray-200 text-black border-gray-300">{item}</Badge>)}</div>
                    </div>
                 </div>
            </section>
            
            <section className="mb-6">
                <h2 className="text-xl font-bold border-b pb-2 mb-4">Job Steps, Hazards, and Controls</h2>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[15%] text-xs">Step</TableHead>
                                <TableHead className="w-[15%] text-xs">Principal Hazard</TableHead>
                                <TableHead className="w-[15%] text-xs">Potential Hazards</TableHead>
                                <TableHead className="w-[15%] text-xs">Control Measures</TableHead>
                                <TableHead className="text-xs">Risk</TableHead>
                                <TableHead className="w-[10%] text-xs">Tasks</TableHead>
                                <TableHead className="w-[15%] text-xs">Comments</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jsa.steps.map((step, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-semibold align-top text-xs">{index + 1}. {step.step_description}</TableCell>
                                    <TableCell className="align-top text-xs">{step.principal_hazard}</TableCell>
                                    <TableCell className="align-top text-xs">{step.hazards.join(', ')}</TableCell>
                                    <TableCell className="align-top text-xs">{step.controls.join(', ')}</TableCell>
                                    <TableCell className="align-top text-xs">
                                        <div className="flex items-center gap-2">
                                           <div className={cn("h-4 w-4 rounded-full border border-black", riskMatrix[step.severity][step.likelihood])} />
                                           <div>
                                               <p>S: {step.severity}</p>
                                               <p>L: {step.likelihood}</p>
                                           </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top text-xs">{step.tasks}</TableCell>
                                    <TableCell className="align-top text-xs">{step.comments}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>
            
            <section>
                 <h2 className="text-xl font-bold border-b pb-2 mb-4 flex items-center gap-2"><Users /> Signatures</h2>
                 {jsa.signatures.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {jsa.signatures.map((sig, index) => (
                            <div key={index} className="p-2 border rounded-md">
                                <p className="font-semibold text-sm">{sig.employee_name}</p>
                                <p className="text-xs text-gray-600">Signed on {format(new Date(sig.sign_date), 'P')}</p>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-sm text-gray-500">No signatures yet.</p>
                 )}
            </section>
        </div>
    );
};

export default JsaPrintPage;
