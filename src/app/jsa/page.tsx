
'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { JSA, Area } from '@/types';
import { PlusCircle, Users, Shield, FileSignature, Edit, UserCheck, Trash2, MapPin, Share2, Printer, Wand2, Loader2, Clock, MoreVertical, Copy } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { getJsaAnalysisAction } from '@/app/actions';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const jsaStepSchema = z.object({
  step_description: z.string().min(1, { message: 'Step description cannot be empty.' }),
  hazards: z.string().min(1, { message: 'Please list at least one hazard.' }),
  controls: z.string().min(1, { message: 'Please list at least one control measure.' }),
});

const jsaFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }),
  areaId: z.string({ required_error: 'Please select an area.' }).min(1, { message: 'Please select an area.' }),
  job_description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
  required_ppe: z.array(z.string()).optional(),
  other_ppe: z.string().optional(),
  valid_from: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Please enter a valid start date.' }),
  valid_to: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Please enter a valid end date.' }),
  steps: z.array(jsaStepSchema).min(1, 'At least one job step is required.'),
}).refine(data => (data.required_ppe && data.required_ppe.length > 0) || (data.other_ppe && data.other_ppe.trim() !== ''), {
    message: 'Please select at least one PPE or specify in the "Other" field.',
    path: ['required_ppe'],
}).refine(data => new Date(data.valid_to) > new Date(data.valid_from), {
  message: "End date must be after start date.",
  path: ["valid_to"],
});


type JsaFormValues = z.infer<typeof jsaFormSchema>;

const PREDEFINED_PPE = [
  { id: 'ppe_1', label: 'Safety Glasses' },
  { id: 'ppe_2', label: 'Hard Hat' },
  { id: 'ppe_3', label: 'Steel-toed Boots' },
  { id: 'ppe_4', label: 'High-visibility Vest' },
  { id: 'ppe_5', label: 'Gloves' },
  { id: 'ppe_6', label: 'Hearing Protection' },
];

const AreaSelectOptions = ({ areas, level = 0 }: { areas: Area[]; level?: number }) => {
  return (
    <>
      {areas.map(area => (
        <React.Fragment key={area.area_id}>
          <SelectItem value={area.area_id}>
             <span style={{ paddingLeft: `${level * 1.25}rem` }}>{area.name}</span>
          </SelectItem>
          {area.children && <AreaSelectOptions areas={area.children} level={level + 1} />}
        </React.Fragment>
      ))}
    </>
  );
};


const JsaFormDialog = ({
    isOpen, onOpenChange, onSave, jsa, mode, areas
} : {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: JsaFormValues, jsaId?: string) => Promise<void>;
    jsa: JSA | null;
    mode: 'create' | 'edit' | 'copy';
    areas: Area[];
}) => {
  const { toast } = useToast();
  const form = useForm<JsaFormValues>({
    resolver: zodResolver(jsaFormSchema),
    defaultValues: {
      title: '', job_description: '', required_ppe: [], other_ppe: '', areaId: '', steps: [{ step_description: '', hazards: '', controls: '' }],
    },
  });

  useEffect(() => {
    if (jsa) {
        form.reset({
            title: jsa.title,
            job_description: jsa.job_description,
            areaId: jsa.areaId,
            required_ppe: jsa.required_ppe.filter(ppe => PREDEFINED_PPE.some(p => p.label === ppe)),
            other_ppe: jsa.required_ppe.filter(ppe => !PREDEFINED_PPE.some(p => p.label === ppe)).join(', '),
            steps: jsa.steps.map(s => ({...s, hazards: s.hazards.join(', '), controls: s.controls.join(', ')})),
            valid_from: mode === 'copy' ? '' : format(new Date(jsa.valid_from), "yyyy-MM-dd'T'HH:mm"),
            valid_to: mode === 'copy' ? '' : format(new Date(jsa.valid_to), "yyyy-MM-dd'T'HH:mm"),
        });
    } else {
        form.reset({
          title: '', job_description: '', required_ppe: [], other_ppe: '', areaId: '', steps: [{ step_description: '', hazards: '', controls: '' }],
        });
    }
  }, [jsa, mode, form, isOpen]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'steps' });

  const onSubmit = async (data: JsaFormValues) => {
    await onSave(data, mode === 'edit' ? jsa?.jsa_id : undefined);
    onOpenChange(false);
  };

  const dialogTitle = mode === 'edit' ? 'Edit JSA' : mode === 'copy' ? 'Copy JSA' : 'Create a New JSA';
  const dialogDescription = mode === 'edit' ? `Update the details for JSA: ${jsa?.display_id}`
    : mode === 'copy' ? `Create a new JSA based on ${jsa?.display_id}. Please update the validity dates.`
    : 'Fill in the details below. For fields that accept multiple items, please use commas.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
            <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>JSA Title</FormLabel><FormControl><Input placeholder="e.g., Operating the hydraulic press" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField name="areaId" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Area / Operation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an area or operation" /></SelectTrigger></FormControl>
                    <SelectContent><AreaSelectOptions areas={areas} /></SelectContent>
                  </Select><FormMessage />
                </FormItem>
            )}/>
            <FormField name="job_description" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Job Description</FormLabel><FormControl><Textarea placeholder="Describe the job this JSA is for..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div className="grid grid-cols-2 gap-4">
                <FormField name="valid_from" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Valid From</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField name="valid_to" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Valid To</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField name="required_ppe" control={form.control} render={() => (
                <FormItem>
                  <div className="mb-4"><FormLabel className="text-base">Required PPE</FormLabel><FormDescription>Select all common PPE that apply.</FormDescription></div>
                  <div className="grid grid-cols-2 gap-2">
                    {PREDEFINED_PPE.map((item) => (
                      <FormField key={item.id} control={form.control} name="required_ppe" render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(item.label)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item.label]) : field.onChange(field.value?.filter((value) => value !== item.label))}/></FormControl>
                              <FormLabel className="font-normal">{item.label}</FormLabel>
                            </FormItem>
                      )}/>
                    ))}
                  </div><FormMessage />
                </FormItem>
            )}/>
            <FormField name="other_ppe" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Other PPE (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., Face shield, Respirator" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-2">Job Steps</h3>
              {fields.map((field, index) => (
                <Card key={field.id} className="mb-4 p-4 relative bg-muted/30">
                   <div className="space-y-4">
                     <p className="font-semibold">Step {index + 1}</p>
                     <FormField control={form.control} name={`steps.${index}.step_description`} render={({ field }) => (
                        <FormItem><FormLabel>Step Description</FormLabel><FormControl><Textarea placeholder="Describe this step..." {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                     <FormField control={form.control} name={`steps.${index}.hazards`} render={({ field }) => (
                        <FormItem><FormLabel>Potential Hazards (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., Pinch points, Loud noise" {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                     <FormField control={form.control} name={`steps.${index}.controls`} render={({ field }) => (
                        <FormItem><FormLabel>Control Measures (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., Use two-hand controls, Wear ear protection" {...field} /></FormControl><FormMessage /></FormItem>
                     )}/>
                   </div>
                   {fields.length > 1 && (
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /><span className="sr-only">Remove Step</span></Button>
                   )}
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ step_description: '', hazards: '', controls: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Step</Button>
            </div>
        </div>
        <DialogFooter><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save JSA</Button></DialogFooter>
      </form>
    </Form>
    </DialogContent>
    </Dialog>
  )
}

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

const JsaDetailsDialog = ({ jsa, isOpen, onOpenChange, onSign, onShare, currentUser, areaPath }: { jsa: JSA | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onSign: (updatedJsa: JSA) => Promise<void>; onShare: () => void; currentUser: string; areaPath: string; }) => {
    const { toast } = useToast();
    const [signatureName, setSignatureName] = useState(currentUser);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    useEffect(() => { if (isOpen) setAnalysisResult(null); }, [isOpen]);

    if (!jsa) return null;

    const hasSigned = jsa.signatures.some(s => s.employee_name === currentUser);

    const handleSign = () => {
        if (signatureName.trim() && !hasSigned) {
            const updatedJsa = { ...jsa, signatures: [...jsa.signatures, { employee_name: signatureName.trim(), sign_date: new Date().toISOString() }] };
            onSign(updatedJsa);
        }
    };
    
    const handlePrint = () => window.print();

    const handleAiAnalysis = async () => {
        setIsAnalyzing(true); setAnalysisResult(null);
        try {
            const result = await getJsaAnalysisAction({
                title: jsa.title, jobDescription: jsa.job_description, requiredPpe: jsa.required_ppe.join(', '),
                steps: jsa.steps.map(step => ({ step_description: step.step_description, hazards: step.hazards.join(', '), controls: step.controls.join(', ') })),
            });
            if (result.analysis) setAnalysisResult(result.analysis);
            else toast({ variant: "destructive", title: "Analysis Failed", description: "The AI analysis returned no result." });
        } catch (error) {
            console.error(error); toast({ variant: "destructive", title: "Analysis Error", description: "An unexpected error occurred." });
        } finally { setIsAnalyzing(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col printable-area">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><FileSignature /> {jsa.title}</span>
                         <div className="flex items-center gap-1 no-print">
                            <Button type="button" variant="ghost" size="icon" onClick={onShare}><Share2 className="h-5 w-5" /><span className="sr-only">Share</span></Button>
                            <Button type="button" variant="ghost" size="icon" onClick={handlePrint}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
                         </div>
                    </DialogTitle>
                    <DialogDescription>{jsa.job_description}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><h3 className="font-semibold mb-2 flex items-center gap-2"><MapPin /> Area / Operation</h3><p className="text-muted-foreground">{areaPath}</p></div>
                      <div><h3 className="font-semibold mb-2 flex items-center gap-2"><Clock /> Permit Validity</h3><p className="text-muted-foreground">{format(new Date(jsa.valid_from), "P p")} to {format(new Date(jsa.valid_to), "P p")}</p></div>
                    </div>
                    <Separator />
                    <div><h3 className="font-semibold mb-2 flex items-center gap-2"><Shield /> Required PPE</h3><div className="flex flex-wrap gap-2">{jsa.required_ppe.map((item, index) => <Badge key={index} variant="secondary">{item}</Badge>)}</div></div>
                    <Separator />
                    <div>
                        <div className="flex items-center justify-between mb-2"><h3 className="font-semibold flex items-center gap-2"><Wand2 /> AI Analysis</h3><Button size="sm" onClick={handleAiAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Analyze JSA</Button></div>
                        {isAnalyzing && (<div className="p-4 bg-muted/50 rounded-lg border flex items-center justify-center min-h-[100px]"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-sm text-muted-foreground">AI is reviewing the JSA...</p></div>)}
                        {analysisResult && (<Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"><CardContent className="p-4"><p className="text-sm whitespace-pre-wrap">{analysisResult}</p></CardContent></Card>)}
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2">Job Steps, Hazards, and Controls</h3>
                        <div className="space-y-4">{jsa.steps.map((step, index) => (<div key={index} className="p-4 border rounded-lg bg-muted/50"><p className="font-semibold">Step {index + 1}: {step.step_description}</p><div className="mt-2 pl-4"><p className="text-sm"><strong className="text-destructive">Hazards:</strong> {step.hazards.join(', ')}</p><p className="text-sm"><strong className="text-green-600">Controls:</strong> {step.controls.join(', ')}</p></div></div>))}</div>
                    </div>
                    <Separator />
                    <div><h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Signatures ({jsa.signatures.length})</h3><ul className="list-disc list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto">{jsa.signatures.length > 0 ? jsa.signatures.map((sig, index) => (<li key={index}>{sig.employee_name} (Signed on {new Date(sig.sign_date).toLocaleDateString()})</li>)) : <li>No signatures yet.</li>}</ul></div>
                </div>
                <DialogFooter className="mt-auto pt-4 border-t !justify-between no-print">
                    <div className="text-xs text-muted-foreground">{hasSigned ? `You acknowledged this on ${new Date(jsa.signatures.find(s => s.employee_name === currentUser)!.sign_date).toLocaleDateString()}` : "Please read carefully before signing."}</div>
                    <div className="flex items-center gap-2"><Input className="w-48" placeholder="Enter your name" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} disabled={hasSigned}/><Button onClick={handleSign} disabled={hasSigned || !signatureName.trim()}><UserCheck className="mr-2 h-4 w-4" />{hasSigned ? 'Acknowledged' : 'Acknowledge and Sign'}</Button></div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const JsaSummaryCard = ({ jsa, areaPath, onViewDetails, onEdit, onCopy }: { jsa: JSA; areaPath: string; onViewDetails: () => void; onEdit: () => void; onCopy: () => void; }) => {
    const statusVariant = { Active: 'default', Expired: 'destructive', Draft: 'secondary' } as const;
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-start justify-between">
                    <span className="pr-4">{jsa.title}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onViewDetails}><FileSignature className="mr-2"/>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={onEdit}><Edit className="mr-2"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={onCopy}><Copy className="mr-2"/>Copy</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10">{jsa.job_description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                    <Badge variant="outline">{jsa.display_id}</Badge>
                    <Badge variant={statusVariant[jsa.status]}>{jsa.status}</Badge>
                </div>
                 <div className="flex items-center text-sm text-muted-foreground gap-2 pt-1"><Clock className="h-4 w-4" /><span>Expires: {format(new Date(jsa.valid_to), "P")}</span></div>
                 <div className="flex items-center text-sm text-muted-foreground gap-2"><Users className="h-4 w-4" /><span>{jsa.signatures.length} Signature(s)</span></div>
            </CardContent>
            <CardFooter className="mt-auto border-t pt-4">
                <Button className="w-full" onClick={onViewDetails}><FileSignature className="mr-2 h-4 w-4" /> Read and Sign</Button>
            </CardFooter>
        </Card>
    );
}

export default function JsaPage() {
    const MOCKED_CURRENT_USER = "Sarah Miller";
    const { jsas, addJsa, updateJsa, areas } = useAppData();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    
    const [isFormOpen, setFormOpen] = useState(false);
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [selectedJsa, setSelectedJsa] = useState<JSA | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'copy'>('create');

    useEffect(() => {
        const jsaIdFromUrl = searchParams.get('id');
        if (jsaIdFromUrl) {
            const jsa = jsas.find(j => j.jsa_id === jsaIdFromUrl);
            if(jsa) {
                setSelectedJsa(jsa);
                setDetailsOpen(true);
            }
        }
    }, [searchParams, jsas]);

    const handleOpenCreate = () => {
        setSelectedJsa(null); setFormMode('create'); setFormOpen(true);
    }
    const handleOpenEdit = (jsa: JSA) => {
        setSelectedJsa(jsa); setFormMode('edit'); setFormOpen(true);
    }
    const handleOpenCopy = (jsa: JSA) => {
        setSelectedJsa(jsa); setFormMode('copy'); setFormOpen(true);
    }
    const handleOpenDetails = (jsa: JSA) => {
        setSelectedJsa(jsa); setDetailsOpen(true);
    }

    const handleShare = (jsaId: string) => {
        const url = `${window.location.origin}/jsa?id=${jsaId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast({ title: "Link Copied", description: "A shareable link has been copied to your clipboard." });
        });
    };

    const handleSignJsa = async (updatedJsa: JSA) => {
        await updateJsa(updatedJsa);
        toast({ title: "JSA Signed", description: `Thank you for signing.` });
    };

    const handleSaveJsa = async (data: JsaFormValues, jsaId?: string) => {
        const otherPpeItems = data.other_ppe ? data.other_ppe.split(',').map(s => s.trim()).filter(Boolean) : [];
        const allPpe = [...(data.required_ppe || []), ...otherPpeItems];

        if (jsaId && selectedJsa) { // Editing
            const updatedJsa: JSA = {
                ...selectedJsa, ...data, required_ppe: allPpe,
                steps: data.steps.map(step => ({...step, hazards: step.hazards.split(','), controls: step.controls.split(',')})),
            };
            await updateJsa(updatedJsa);
            toast({ title: "JSA Updated", description: "The JSA has been successfully updated." });
        } else { // Creating or Copying
            const newJsaData = { ...data, required_ppe: allPpe, steps: data.steps.map(step => ({ ...step, hazards: step.hazards.split(','), controls: step.controls.split(',') }))};
            await addJsa(newJsaData);
            toast({ title: "JSA Created", description: `The JSA "${data.title}" has been successfully created.` });
        }
    };
    
    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Job Safety Analyses (JSAs)</h2>
                    <Button onClick={handleOpenCreate}><PlusCircle className="mr-2 h-4 w-4" /> Create JSA</Button>
                </div>
                <p className="text-muted-foreground">Review and acknowledge safety procedures for specific jobs.</p>

                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {jsas.map((jsa) => {
                        const areaPath = findAreaPathById(areas, jsa.areaId) || 'Unknown Area';
                        return (
                          <JsaSummaryCard 
                            key={jsa.jsa_id} 
                            jsa={jsa}
                            areaPath={areaPath}
                            onViewDetails={() => handleOpenDetails(jsa)}
                            onEdit={() => handleOpenEdit(jsa)}
                            onCopy={() => handleOpenCopy(jsa)}
                          />
                        )
                    })}
                </div>
            </div>

            <JsaFormDialog
                isOpen={isFormOpen}
                onOpenChange={setFormOpen}
                onSave={handleSaveJsa}
                jsa={selectedJsa}
                mode={formMode}
                areas={areas}
            />

            <JsaDetailsDialog
                isOpen={isDetailsOpen}
                onOpenChange={setDetailsOpen}
                jsa={selectedJsa}
                onSign={handleSignJsa}
                onShare={() => selectedJsa && handleShare(selectedJsa.jsa_id)}
                currentUser={MOCKED_CURRENT_USER}
                areaPath={selectedJsa ? findAreaPathById(areas, selectedJsa.areaId) : ''}
            />
        </AppShell>
    );
}
