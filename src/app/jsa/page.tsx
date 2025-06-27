'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { mockJSAs, mockAreas } from '@/lib/mockData';
import type { JSA, Area } from '@/types';
import { PlusCircle, Users, Shield, FileSignature, Edit, UserCheck, Trash2, MapPin } from 'lucide-react';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const jsaStepSchema = z.object({
  step_description: z.string().min(1, { message: 'Step description cannot be empty.' }),
  hazards: z.string().min(1, { message: 'Please list at least one hazard.' }),
  controls: z.string().min(1, { message: 'Please list at least one control measure.' }),
});

const jsaFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }),
  areaId: z.string({ required_error: 'Please select an area.' }).min(1, { message: 'Please select an area.' }),
  job_description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
  required_ppe: z.string().min(1, { message: 'Please list required PPE.' }),
  steps: z.array(jsaStepSchema).min(1, 'At least one job step is required.'),
});

type JsaFormValues = z.infer<typeof jsaFormSchema>;

// Helper component to render nested area options for the select dropdown
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


const CreateJsaForm = ({ onAddJsa, setOpen }: { onAddJsa: (jsa: JSA) => void, setOpen: (open: boolean) => void }) => {
  const form = useForm<JsaFormValues>({
    resolver: zodResolver(jsaFormSchema),
    defaultValues: {
      title: '',
      job_description: '',
      required_ppe: '',
      areaId: '',
      steps: [{ step_description: '', hazards: '', controls: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps',
  });
  
  const { toast } = useToast();

  const onSubmit = (data: JsaFormValues) => {
    const newJsa: JSA = {
        jsa_id: `JSA${String(Math.floor(Math.random() * 900) + 100)}`,
        title: data.title,
        job_description: data.job_description,
        areaId: data.areaId,
        required_ppe: data.required_ppe.split(',').map(s => s.trim()).filter(Boolean),
        steps: data.steps.map(step => ({
            step_description: step.step_description,
            hazards: step.hazards.split(',').map(s => s.trim()).filter(Boolean),
            controls: step.controls.split(',').map(s => s.trim()).filter(Boolean),
        })),
        created_by: 'Safety Manager',
        created_date: new Date().toISOString(),
        signatures: [],
    };
    onAddJsa(newJsa);
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required PPE (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Safety glasses, Steel-toed boots" {...field} />
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

// This component now takes a jsa and handles its own dialog state.
const JsaCard = ({ jsa, onSign, currentUser, areaPath }: { jsa: JSA, onSign: (jsaId: string, name: string) => void, currentUser: string, areaPath: string }) => {
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
                    <DialogTitle className="text-2xl flex items-center gap-2"><FileSignature /> {jsa.title}</DialogTitle>
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
    const [jsas, setJsas] = useState<JSA[]>(mockJSAs);
    const { toast } = useToast();
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

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
    
    const handleAddJsa = (newJsa: JSA) => {
        setJsas(prevJsas => [newJsa, ...prevJsas]);
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
                            <CreateJsaForm onAddJsa={handleAddJsa} setOpen={setCreateDialogOpen} />
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
                          <JsaCard key={jsa.jsa_id} jsa={jsa} onSign={handleSignJsa} currentUser={MOCKED_CURRENT_USER} areaPath={areaPath} />
                        )
                    })}
                </div>
            </div>
        </AppShell>
    );
}
