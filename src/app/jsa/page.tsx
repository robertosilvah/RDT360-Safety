
'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { mockAreas } from '@/lib/mockDataLocal';
import type { JSA, Area } from '@/types';
import { PlusCircle, Users, Shield, FileSignature, Edit, UserCheck, Trash2, MapPin, Share2 } from 'lucide-react';
import React, { useState } from 'react';
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
  steps: z.array(jsaStepSchema).min(1, 'At least one job step is required.'),
}).refine(data => (data.required_ppe && data.required_ppe.length > 0) || (data.other_ppe && data.other_ppe.trim() !== ''), {
    message: 'Please select at least one PPE or specify in the "Other" field.',
    path: ['required_ppe'],
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


const CreateJsaForm = ({ onAddJsa, setOpen }: { onAddJsa: (jsa: Omit<JSA, 'jsa_id'>) => Promise<void>, setOpen: (open: boolean) => void }) => {
  const form = useForm<JsaFormValues>({
    resolver: zodResolver(jsaFormSchema),
    defaultValues: {
      title: '',
      job_description: '',
      required_ppe: [],
      other_ppe: '',
      areaId: '',
      steps: [{ step_description: '', hazards: '', controls: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });
  
  const { toast } = useToast();

  const onSubmit = async (data: JsaFormValues) => {
    const otherPpeItems = data.other_ppe ? data.other_ppe.split(',').map(s => s.trim()).filter(Boolean) : [];
    const allPpe = [...(data.required_ppe || []), ...otherPpeItems];

    const newJsa: Omit<JSA, 'jsa_id'> = {
        title: data.title,
        job_description: data.job_description,
        areaId: data.areaId,
        required_ppe: allPpe,
        steps: data.steps.map(step => ({
            step_description: step.step_description,
            hazards: step.hazards.split(',').map(s => s.trim()).filter(Boolean),
            controls: step.controls.split(',').map(s => s.trim()).filter(Boolean),
        })),
        created_by: 'Safety Manager',
        created_date: new Date().toISOString(),
        signatures: [],
    };
    await onAddJsa(newJsa);
    toast({
      title: 'JSA Created',
      description: `The JSA "${data.title}" has been successfully created.`,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Create a New Job Safety Analysis</DialogTitle>
          <DialogDescription>Fill in the details below. For fields that accept multiple items, please separate them with a comma.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>JSA Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Operating the hydraulic press" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="areaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area / Operation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an area or operation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <AreaSelectOptions areas={mockAreas} />
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the job this JSA is for..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="required_ppe"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Required PPE</FormLabel>
                    <FormDescription>Select all common PPE that apply.</FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PREDEFINED_PPE.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="required_ppe"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.label)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.label])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.label
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="other_ppe"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Other PPE (comma-separated)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Face shield, Respirator" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Job Steps</h3>
              {fields.map((field, index) => (
                <Card key={field.id} className="mb-4 p-4 relative bg-muted/30">
                   <div className="space-y-4">
                     <p className="font-semibold">Step {index + 1}</p>
                     <FormField
                        control={form.control}
                        name={`steps.${index}.step_description`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Step Description</FormLabel>
                            <FormControl><Textarea placeholder="Describe this step..." {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name={`steps.${index}.hazards`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Potential Hazards (comma-separated)</FormLabel>
                            <FormControl><Input placeholder="e.g., Pinch points, Loud noise" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name={`steps.${index}.controls`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Control Measures (comma-separated)</FormLabel>
                            <FormControl><Input placeholder="e.g., Use two-hand controls, Wear ear protection" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                   </div>
                   {fields.length > 1 && (
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                       <Trash2 className="h-4 w-4 text-destructive" />
                       <span className="sr-only">Remove Step</span>
                     </Button>
                   )}
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ step_description: '', hazards: '', controls: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Step
              </Button>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Create JSA</Button>
        </DialogFooter>
      </form>
    </Form>
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

const JsaCard = ({ jsa, onSign, currentUser, areaPath, isOpen, onOpenChange, onShare }: { jsa: JSA, onSign: (updatedJsa: JSA) => Promise<void>, currentUser: string, areaPath: string, isOpen: boolean, onOpenChange: (open: boolean) => void, onShare: () => void }) => {
    const [signatureName, setSignatureName] = useState(currentUser);
    const hasSigned = jsa.signatures.some(s => s.employee_name === currentUser);

    const handleSign = () => {
        if (signatureName.trim() && !hasSigned) {
            const updatedJsa = {
                ...jsa,
                signatures: [...jsa.signatures, { employee_name: signatureName.trim(), sign_date: new Date().toISOString() }],
            };
            onSign(updatedJsa);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                        <span>{jsa.title}</span>
                        <Badge variant="outline">{jsa.jsa_id}</Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 h-10">{jsa.job_description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Users className="h-4 w-4" />
                        <span>{jsa.signatures.length} Signature(s)</span>
                    </div>
                     <div className="flex items-center text-sm text-muted-foreground gap-2 pt-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{areaPath}</span>
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
                    <DialogTitle className="text-2xl flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><FileSignature /> {jsa.title}</span>
                         <Button type="button" variant="ghost" size="icon" onClick={onShare}>
                            <Share2 className="h-5 w-5" />
                            <span className="sr-only">Share</span>
                         </Button>
                    </DialogTitle>
                    <DialogDescription>{jsa.job_description}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-6 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><MapPin /> Area / Operation</h3>
                        <p className="text-muted-foreground">{areaPath}</p>
                    </div>
                    <Separator />
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
    const { jsas, addJsa, updateJsa } = useAppData();
    const { toast } = useToast();
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const searchParams = useSearchParams();
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    React.useEffect(() => {
        const jsaIdFromUrl = searchParams.get('id');
        if (jsaIdFromUrl && jsas.some(j => j.jsa_id === jsaIdFromUrl)) {
            setOpenDialogId(jsaIdFromUrl);
        }
    }, [searchParams, jsas]);

    const handleShare = (jsaId: string) => {
        const url = `${window.location.origin}/jsa?id=${jsaId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast({
                title: "Link Copied",
                description: "A shareable link has been copied to your clipboard.",
            });
        });
    };

    const handleSignJsa = async (updatedJsa: JSA) => {
        await updateJsa(updatedJsa);
        toast({
            title: "JSA Signed",
            description: `Thank you for signing.`,
        });
    };
    
    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Job Safety Analyses (JSAs)</h2>
                     <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create JSA
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <CreateJsaForm onAddJsa={addJsa} setOpen={setCreateDialogOpen} />
                        </DialogContent>
                    </Dialog>
                </div>
                <p className="text-muted-foreground">
                    Review and acknowledge safety procedures for specific jobs.
                </p>

                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {jsas.map((jsa) => {
                        const areaPath = findAreaPathById(mockAreas, jsa.areaId) || 'Unknown Area';
                        return (
                          <JsaCard 
                            key={jsa.jsa_id} 
                            jsa={jsa} 
                            onSign={handleSignJsa} 
                            currentUser={MOCKED_CURRENT_USER} 
                            areaPath={areaPath}
                            isOpen={openDialogId === jsa.jsa_id}
                            onOpenChange={(open) => setOpenDialogId(open ? jsa.jsa_id : null)}
                            onShare={() => handleShare(jsa.jsa_id)}
                          />
                        )
                    })}
                </div>
            </div>
        </AppShell>
    );
}

    