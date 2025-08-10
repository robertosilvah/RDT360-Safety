
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/context/AppDataContext';
import type { Investigation, Incident, CorrectiveAction } from '@/types';
import { Printer, Siren, AlertCircle, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function InvestigationPrintPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { investigations, incidents, correctiveActions, brandingSettings } = useAppData();
    const [investigation, setInvestigation] = useState<Investigation | null | undefined>(undefined);
    
    useEffect(() => {
        if (id) {
            const foundInvestigation = investigations.find(i => i.investigation_id === id);
            setInvestigation(foundInvestigation);
        }
    }, [id, investigations]);
    
    if (investigation === undefined) {
        return <div className="flex items-center justify-center h-screen"><Skeleton className="h-96 w-full max-w-4xl" /></div>;
    }
    
    if (investigation === null) {
        notFound();
    }
    
    const handlePrint = () => {
        window.print();
    };

    const incident = incidents.find(i => i.incident_id === investigation.incident_id);
    const linkedActions = correctiveActions.filter(a => a.related_to_investigation === investigation.investigation_id);

    const severityVariant: { [key in Incident['severity']]: 'destructive' | 'secondary' | 'default' } = {
        'High': 'destructive',
        'Medium': 'secondary',
        'Low': 'default',
    };

    return (
        <div className="bg-white text-black min-h-screen">
            <header className="p-8 flex justify-between items-center no-print">
                <h1 className="text-2xl font-bold">Print Preview</h1>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Investigation</Button>
            </header>
            <main className="p-8 printable-area">
                 <header className="mb-8 text-center">
                    {brandingSettings?.logoUrl && <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain mx-auto mb-4" data-ai-hint="logo" />}
                    <h1 className="text-3xl font-bold">Incident Investigation Report</h1>
                    <p className="text-sm text-gray-500 mt-1">Investigation ID: {investigation.display_id}</p>
                </header>

                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 border-b pb-2">Incident Details</h2>
                    {incident ? (
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm p-4 border rounded-lg">
                           <div><strong className="font-semibold block text-gray-700">Incident ID:</strong> {incident.display_id}</div>
                           <div><strong className="font-semibold block text-gray-700">Date:</strong> {format(new Date(incident.date), "P p")}</div>
                           <div className="col-span-2"><strong className="font-semibold block text-gray-700">Area:</strong> {incident.area}</div>
                           <div className="col-span-2"><strong className="font-semibold block text-gray-700">Description:</strong> {incident.description}</div>
                           <div><strong className="font-semibold block text-gray-700">Type:</strong> {incident.type}</div>
                           <div><strong className="font-semibold block text-gray-700">Severity:</strong> <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge></div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Incident details not found.</p>
                    )}
                </section>

                <section className="mb-6 space-y-4">
                     <h2 className="text-xl font-bold mb-2 border-b pb-2">Investigation Analysis</h2>
                     <div className="break-inside-avoid">
                        <h3 className="font-semibold">Events History</h3>
                        <p className="text-sm text-gray-700 p-3 border rounded-md bg-gray-50 whitespace-pre-wrap">{investigation.events_history}</p>
                     </div>
                     <div className="break-inside-avoid">
                        <h3 className="font-semibold">Root Cause Analysis</h3>
                        <p className="text-sm text-gray-700 p-3 border rounded-md bg-gray-50 whitespace-pre-wrap">{investigation.root_cause}</p>
                     </div>
                     <div className="break-inside-avoid">
                        <h3 className="font-semibold">Contributing Factors</h3>
                        <p className="text-sm text-gray-700 p-3 border rounded-md bg-gray-50 whitespace-pre-wrap">{investigation.contributing_factors}</p>
                     </div>
                      <div className="break-inside-avoid">
                        <h3 className="font-semibold">Lessons Learned</h3>
                        <p className="text-sm text-gray-700 p-3 border rounded-md bg-gray-50 whitespace-pre-wrap">{investigation.lessons_learned}</p>
                     </div>
                </section>
                
                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 border-b pb-2">Action Plan &amp; Corrective Actions</h2>
                    <div className="p-3 border rounded-md bg-gray-50 mb-4">
                        <h3 className="font-semibold">Recommended Plan</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{investigation.action_plan}</p>
                    </div>
                     {linkedActions.length > 0 && (
                        <div className="space-y-2">
                             <h3 className="font-semibold">Created Corrective Actions:</h3>
                            {linkedActions.map(action => (
                                <div key={action.action_id} className="text-sm p-2 border rounded-md break-inside-avoid">
                                    <p><strong>{action.display_id}:</strong> {action.description}</p>
                                    <p className="text-xs text-gray-500">Responsible: {action.responsible_person} | Due: {format(new Date(action.due_date), 'P')} | Status: {action.status}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 border-b pb-2">Attached Documents</h2>
                    <div className="space-y-2 text-sm">
                        {investigation.documents.length > 0 ? investigation.documents.map(doc => (
                            <p key={doc.url} className="flex items-center gap-2"><FileText className="h-4 w-4" /> {doc.name}</p>
                        )) : <p className="text-gray-500">No documents attached.</p>}
                    </div>
                </section>
            </main>
        </div>
    );
}
