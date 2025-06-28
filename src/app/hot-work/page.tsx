
'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { mockAreas } from '@/lib/mockDataLocal';
import type { HotWorkPermit, Area } from '@/types';
import { PlusCircle, Users, FileSignature, Edit, UserCheck, Trash2, MapPin, Flame, Clock, CheckSquare, Share2 } from 'lucide-react';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppData } from '@/context/AppDataContext';


const permitFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }),
  areaId: z.string({ required_error: 'Please select an area.' }).min(1, { message: 'Please select an area.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
  valid_from: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Please enter a valid start date.' }),
  valid_to: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Please enter a valid end date.' }),
  precautions: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one precaution.",
  }),
  other_precautions: z.string().optional(),
}).refine(data => new Date(data.valid_to) > new Date(data.valid_from), {
  message: "End date must be after start date.",
  path: ["valid_to"],
});


type PermitFormValues = z.infer<typeof permitFormSchema>;

const PREDEFINED_PRECAUTIONS = [
  { id: 'precaution_1', label: 'Fire watch assigned for duration of work + 30 mins post-work.' },
  { id: 'precaution_2', label: 'Area within 35-foot radius cleared of combustibles.' },
  { id: 'precaution_3', label: 'Appropriate fire extinguisher (Type ABC) present and inspected.' },
  { id: 'precaution_4', label: 'Welding curtains/shields used to contain sparks.' },
  { id: 'precaution_5', label: 'Atmosphere tested for flammable gases.' },
  { id: 'precaution_6', label: 'Sprinkler system protection in service' },
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


const CreatePermitForm = ({ onAddPermit, setOpen }: { onAddPermit: (permit: Omit<HotWorkPermit, 'permit_id'>) => Promise<void>, setOpen: (open: boolean) => void }) => {
  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: {
      title: '',
      description: '',
      areaId: '',
      precautions: [],
      other_precautions: '',
    },
  });
  
  const { toast } = useToast();

  const onSubmit = async (data: PermitFormValues) => {
    const allPrecautions = [...data.precautions];
    if (data.other_precautions) {
        allPrecautions.push(data.other_precautions);
    }

    const newPermit: Omit<HotWorkPermit, 'permit_id'> = {
        title: data.title,
        description: data.description,
        areaId: data.areaId,
        valid_from: new Date(data.valid_from).toISOString(),
        valid_to: new Date(data.valid_to).toISOString(),
        precautions: allPrecautions,
        created_by: 'Safety Manager',
        created_date: new Date().toISOString(),
        signatures: [],
    };
    await onAddPermit(newPermit);
    toast({
      title: 'Hot Work Permit Created',
      description: `The permit "${data.title}" has been successfully created.`,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Create a New Hot Work Permit</DialogTitle>
          <DialogDescription>Fill in the details below to issue a new permit.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Work Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Welding on support beams" {...field} /></FormControl>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the hot work to be performed..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Permit Valid From</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="valid_to"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Permit Valid To</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <Separator />
            <FormField
              control={form.control}
              name="precautions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Safety Precautions</FormLabel>
                    <FormDescription>Select all that apply.</FormDescription>
                  </div>
                  {PREDEFINED_PRECAUTIONS.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="precautions"
                      render={({ field }) => (
                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 mb-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.label)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.label])
                                  : field.onChange(field.value?.filter((value) => value !== item.label));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{item.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="other_precautions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Precautions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List any other precautions taken..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Create Permit</Button>
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

const PermitCard = ({ permit, onSign, currentUser, areaPath, isOpen, onOpenChange, onShare }: { permit: HotWorkPermit, onSign: (updatedPermit: HotWorkPermit) => Promise<void>, currentUser: string, areaPath: string, isOpen: boolean, onOpenChange: (open: boolean) => void, onShare: () => void }) => {
    const [signatureName, setSignatureName] = useState(currentUser);
    const hasSigned = permit.signatures.some(s => s.employee_name === currentUser);
    const [isClient, setIsClient] = useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSign = () => {
        if (signatureName.trim() && !hasSigned) {
            const updatedPermit = {
                ...permit,
                signatures: [...permit.signatures, { employee_name: signatureName.trim(), sign_date: new Date().toISOString() }],
            };
            onSign(updatedPermit);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                        <span>{permit.title}</span>
                        <Badge variant="outline">{permit.permit_id}</Badge>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 h-10">{permit.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{areaPath}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Clock className="h-4 w-4" />
                        {isClient ? (
                           <span>Valid until {format(new Date(permit.valid_to), "MMM d, yyyy h:mm a")}</span>
                        ) : (
                           <Skeleton className="h-4 w-40" />
                        )}
                    </div>
                     <div className="flex items-center text-sm text-muted-foreground gap-2 pt-1">
                        <Users className="h-4 w-4" />
                        <span>{permit.signatures.length} Signature(s)</span>
                    </div>
                </CardContent>
                <CardFooter className="mt-auto border-t pt-4">
                     <DialogTrigger asChild>
                        <Button className="w-full">
                            <Edit className="mr-2 h-4 w-4" /> View and Sign
                        </Button>
                    </DialogTrigger>
                </CardFooter>
            </Card>

            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><Flame /> {permit.title}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={onShare}>
                        <Share2 className="h-5 w-5" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </DialogTitle>
                    <DialogDescription>{permit.description}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><MapPin /> Area / Operation</h3>
                            <p className="text-muted-foreground">{areaPath}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Clock /> Permit Validity</h3>
                            {!isClient ? (
                                <Skeleton className="h-4 w-full" />
                            ) : (
                                <p className="text-muted-foreground">
                                    {format(new Date(permit.valid_from), "MMM d, yyyy h:mm a")} to {format(new Date(permit.valid_to), "MMM d, yyyy h:mm a")}
                                </p>
                            )}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><CheckSquare /> Required Precautions</h3>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {permit.precautions.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users /> Signatures ({permit.signatures.length})</h3>
                        {!isClient ? (
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        ) : (
                            <ul className="list-disc list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto">
                                {permit.signatures.length > 0 ? permit.signatures.map((sig, index) => (
                                    <li key={index}>{sig.employee_name} (Signed on {new Date(sig.sign_date).toLocaleDateString()})</li>
                                )) : <li>No signatures yet.</li>}
                            </ul>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-auto pt-4 border-t !justify-between">
                    <div className="text-xs text-muted-foreground">
                        {!isClient ? (
                            <Skeleton className="h-4 w-48" />
                        ) : hasSigned ? (
                            `You acknowledged this on ${new Date(permit.signatures.find(s => s.employee_name === currentUser)!.sign_date).toLocaleDateString()}`
                        ) : (
                            "Please read carefully before signing."
                        )}
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

export default function HotWorkPermitsPage() {
    const MOCKED_CURRENT_USER = "Sarah Miller";
    const { hotWorkPermits, addHotWorkPermit, updateHotWorkPermit } = useAppData();
    const { toast } = useToast();
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const searchParams = useSearchParams();
    const [openDialogId, setOpenDialogId] = useState<string | null>(null);

    React.useEffect(() => {
        const permitIdFromUrl = searchParams.get('id');
        if (permitIdFromUrl && hotWorkPermits.some(p => p.permit_id === permitIdFromUrl)) {
            setOpenDialogId(permitIdFromUrl);
        }
    }, [searchParams, hotWorkPermits]);

    const handleShare = (permitId: string) => {
        const url = `${window.location.origin}/hot-work?id=${permitId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast({
                title: "Link Copied",
                description: "A shareable link has been copied to your clipboard.",
            });
        });
    };

    const handleSignPermit = async (updatedPermit: HotWorkPermit) => {
        await updateHotWorkPermit(updatedPermit);
        toast({
            title: "Permit Signed",
            description: `Thank you for signing.`,
        });
    };
    
    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Hot Work Permits</h2>
                     <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Create Permit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <CreatePermitForm onAddPermit={addHotWorkPermit} setOpen={setCreateDialogOpen} />
                        </DialogContent>
                    </Dialog>
                </div>
                <p className="text-muted-foreground">
                    Create, review, and acknowledge permits for work involving heat or sparks.
                </p>

                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {hotWorkPermits.map((permit) => {
                        const areaPath = findAreaPathById(mockAreas, permit.areaId) || 'Unknown Area';
                        return (
                          <PermitCard 
                            key={permit.permit_id} 
                            permit={permit} 
                            onSign={handleSignPermit} 
                            currentUser={MOCKED_CURRENT_USER} 
                            areaPath={areaPath}
                            isOpen={openDialogId === permit.permit_id}
                            onOpenChange={(open) => setOpenDialogId(open ? permit.permit_id : null)}
                            onShare={() => handleShare(permit.permit_id)}
                          />
                        )
                    })}
                </div>
            </div>
        </AppShell>
    );
}
