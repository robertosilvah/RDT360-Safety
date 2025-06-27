'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { mockJSAs } from '@/lib/mockData';
import type { JSA } from '@/types';
import { PlusCircle, Users, Shield, FileSignature, Edit, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// This component now takes a jsa and handles its own dialog state.
const JsaCard = ({ jsa, onSign, currentUser }: { jsa: JSA, onSign: (jsaId: string, name: string) => void, currentUser: string }) => {
    const [signatureName, setSignatureName] = useState(currentUser);
    const hasSigned = jsa.signatures.some(s => s.employee_name === currentUser);

    const handleSign = () => {
        if (signatureName.trim() && !hasSigned) {
            onSign(jsa.jsa_id, signatureName.trim());
        }
    };

    return (
        <Dialog>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                        <span>{jsa.title}</span>
                        <Badge variant="outline">{jsa.jsa_id}</Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 h-10">{jsa.job_description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Users className="h-4 w-4" />
                        <span>{jsa.signatures.length} Signature(s)</span>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto border-t pt-4">
                     <DialogTrigger asChild>
                        <Button className="w-full">
                            <Edit className="mr-2 h-4 w-4" /> Read and Sign
                        </Button>
                    </DialogTrigger>
                </CardFooter>
            </Card>

            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2"><FileSignature /> {jsa.title}</DialogTitle>
                    <DialogDescription>{jsa.job_description}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-6 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Shield /> Required PPE</h3>
                        <div className="flex flex-wrap gap-2">
                            {jsa.required_ppe.map((item, index) => <Badge key={index} variant="secondary">{item}</Badge>)}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2">Job Steps, Hazards, and Controls</h3>
                        <div className="space-y-4">
                            {jsa.steps.map((step, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-muted/50">
                                    <p className="font-semibold">Step {index + 1}: {step.step_description}</p>
                                    <div className="mt-2 pl-4">
                                        <p className="text-sm"><strong className="text-destructive">Hazards:</strong> {step.hazards.join(', ')}</p>
                                        <p className="text-sm"><strong className="text-green-600">Controls:</strong> {step.controls.join(', ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Signatures ({jsa.signatures.length})</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto">
                            {jsa.signatures.length > 0 ? jsa.signatures.map((sig, index) => (
                                <li key={index}>{sig.employee_name} (Signed on {new Date(sig.sign_date).toLocaleDateString()})</li>
                            )) : <li>No signatures yet.</li>}
                        </ul>
                    </div>
                </div>
                <DialogFooter className="mt-auto pt-4 border-t !justify-between">
                    <div className="text-xs text-muted-foreground">
                        {hasSigned ? `You acknowledged this on ${new Date(jsa.signatures.find(s => s.employee_name === currentUser)!.sign_date).toLocaleDateString()}` : "Please read carefully before signing."}
                    </div>
                    <div className="flex items-center gap-2">
                         <Input 
                            className="w-48"
                            placeholder="Enter your name" 
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            disabled={hasSigned}
                        />
                        <Button onClick={handleSign} disabled={hasSigned || !signatureName.trim()}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            {hasSigned ? 'Acknowledged' : 'Acknowledge and Sign'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function JsaPage() {
    const MOCKED_CURRENT_USER = "Sarah Miller";
    const [jsas, setJsas] = useState<JSA[]>(mockJSAs);
    const { toast } = useToast();

    const handleSignJsa = (jsaId: string, employeeName: string) => {
        setJsas(prevJsas => {
            return prevJsas.map(jsa => {
                if (jsa.jsa_id === jsaId) {
                    if (jsa.signatures.some(s => s.employee_name === employeeName)) {
                        return jsa;
                    }
                    const newSignatures = [...jsa.signatures, { employee_name: employeeName, sign_date: new Date().toISOString() }];
                    return { ...jsa, signatures: newSignatures };
                }
                return jsa;
            });
        });

        toast({
            title: "JSA Signed",
            description: `Thank you for signing, ${employeeName}.`,
        });
    };

    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Job Safety Analyses (JSAs)</h2>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create JSA
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    Review and acknowledge safety procedures for specific jobs.
                </p>

                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {jsas.map((jsa) => (
                        <JsaCard key={jsa.jsa_id} jsa={jsa} onSign={handleSignJsa} currentUser={MOCKED_CURRENT_USER} />
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
