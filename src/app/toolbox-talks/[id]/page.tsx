

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { ToolboxTalk, ToolboxSignature, TalkSection } from '@/types';
import { Clock, User, MapPin, Edit, Check, Link as LinkIcon, Printer, QrCode, ClipboardList, Paperclip, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import SignaturePad from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/services/backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const SignatureDialog = ({ talk, onSignatureSaved }: { talk: ToolboxTalk; onSignatureSaved: () => void; }) => {
  const { addToolboxSignature } = useAppData();
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState('');
  const sigPadRef = useRef<SignaturePad>(null);

  const handleClear = () => sigPadRef.current?.clear();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter your name.' });
      return;
    }
    if (sigPadRef.current?.isEmpty()) {
      toast({ variant: 'destructive', title: 'Signature Required', description: 'Please provide your signature.' });
      return;
    }

    const signatureDataUrl = sigPadRef.current?.toDataURL('image/png')!;
    try {
      await addToolboxSignature(talk.id, {
        name,
        signature_image_url: signatureDataUrl,
        signed_at: new Date().toISOString(),
      });
      toast({ title: 'Signature Saved', description: 'Thank you for signing.' });
      setName('');
      sigPadRef.current?.clear();
      onSignatureSaved();
      setOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save signature.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="no-print">
          <Edit className="mr-2 h-4 w-4" /> Add Your Signature
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Toolbox Talk</DialogTitle>
          <DialogDescription>Please enter your name and sign below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
          </div>
          <div className="space-y-2">
            <Label>Signature</Label>
            <div className="border rounded-md bg-white">
              <SignaturePad ref={sigPadRef} canvasProps={{ className: 'w-full h-[150px]' }} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClear}>Clear</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Signature</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QrCodeDialog = ({ url, talk }: { url: string; talk: ToolboxTalk }) => {
    const [open, setOpen] = useState(false);
    const handlePrint = () => window.print();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon"><QrCode className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                 <div className="qr-code-printable-area flex flex-col items-center justify-center text-center p-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{talk.title}</DialogTitle>
                        <DialogDescription>Scan to sign this Toolbox Talk</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 my-4 border rounded-lg bg-white">
                        <QRCodeCanvas value={url} size={256} />
                    </div>
                     <p className="text-sm text-muted-foreground max-w-xs">{talk.display_id}</p>
                </div>
                 <DialogFooter className="no-print !justify-between">
                    <Button type="button" variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    <Button type="button" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const TalkSectionDisplay = ({ section, title }: { section: TalkSection; title: string }) => (
  <div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <div className="text-sm p-4 border rounded-md bg-muted/30">
      {section.na ? (
        <span className="italic text-muted-foreground">Not Applicable</span>
      ) : (
        <p className="text-muted-foreground whitespace-pre-wrap">{section.details}</p>
      )}
    </div>
  </div>
);

const SectionToTable = ({ text }: { text: string }) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const isStructured = lines.some(line => line.startsWith('**'));

  if (!isStructured) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;

  lines.forEach(line => {
    if (line.startsWith('**')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.replace(/\*\*/g, '').trim(), items: [] };
    } else if (currentSection) {
      currentSection.items.push(line.trim());
    }
  });
  if (currentSection) sections.push(currentSection);
  
  const getCols = () => {
    const titles = sections.map(s => s.title);
    if (titles.includes('Actions to be taken') && titles.includes('By who?')) {
      return 3;
    }
    return 1;
  }
  const cols = getCols();
  const byWhoData = sections.find(s => s.title === 'By who?')?.items;

  if (cols === 3) {
      return (
        <Table className="border">
            <TableHeader>
                <TableRow>
                    <TableHead>Discussion topic</TableHead>
                    <TableHead>Actions to be taken</TableHead>
                    <TableHead>By who?</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sections.find(s => s.title === 'Key Discussion Points')?.items.map((item, index) => (
                    <TableRow key={index}>
                        <TableCell>{item}</TableCell>
                        <TableCell>{sections.find(s => s.title === 'Actions to be taken')?.items[index] || ''}</TableCell>
                        <TableCell>{byWhoData?.[index] || ''}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      )
  }

  return <p className="whitespace-pre-wrap">{text}</p>;
};

export default function TalkDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { toolboxTalks, brandingSettings, users } = useAppData();
  const [talk, setTalk] = useState<ToolboxTalk | null | undefined>(undefined);
  const [signatures, setSignatures] = useState<ToolboxSignature[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (id) {
        const foundTalk = toolboxTalks.find(t => t.id === id);
        setTalk(foundTalk);
    }
  }, [id, toolboxTalks]);

  useEffect(() => {
    if (talk) {
      const unsubscribe = api.getSignaturesForTalk(talk.id, setSignatures);
      return () => unsubscribe();
    }
  }, [talk]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "A shareable link has been copied to your clipboard." });
  };
  const { toast } = useToast();
  
  if (talk === undefined) {
    return <AppShell><div className="flex-1 space-y-4 p-4 md:p-8 pt-6"><Skeleton className="h-96 w-full" /></div></AppShell>;
  }

  if (talk === null) {
    notFound();
  }
  
  const handlePrint = () => window.print();

  const assignedUsers = users.filter(user => talk.assigned_to.includes(user.id));
  const hasSigned = (userName: string) => signatures.some(sig => sig.name === userName);

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 no-print">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">Toolbox Talk Details</h2>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
                <SignatureDialog talk={talk} onSignatureSaved={() => {}} />
            </div>
        </div>
      </div>
      <div className="bg-white p-4 md:p-8 printable-area">
          {/* Header */}
          <header className="flex justify-between items-start pb-4 border-b">
              <div className="flex items-center gap-4">
                  {brandingSettings?.logoUrl && <Image src={brandingSettings.logoUrl} alt="Company Logo" width={140} height={70} className="object-contain" />}
              </div>
              <div className="text-right text-xs">
                  <p><strong>Template ID:</strong> {talk.display_id}</p>
                  <p><strong>Form Created:</strong> {format(new Date(talk.date), 'PPP p')}</p>
              </div>
          </header>

          {/* Title */}
          <div className="text-center my-6">
              <h1 className="text-3xl font-bold">Safety Toolbox Talk</h1>
          </div>
          
           <div className="grid grid-cols-5 border-t border-l border-r">
                <div className="col-span-1 p-2 border-b border-r font-semibold bg-gray-50">Toolbox Topic</div>
                <div className="col-span-4 p-2 border-b">{talk.topic}</div>
                <div className="col-span-1 p-2 border-b border-r font-semibold bg-gray-50">Assigned Personnel</div>
                <div className="col-span-4 p-2 border-b">
                    <ul className="list-disc pl-5">
                       {assignedUsers.length > 0 ? assignedUsers.map(user => (
                           <li key={user.id}>{user.name} {hasSigned(user.name) && <Check className="inline h-4 w-4 text-green-600" />}</li>
                        )) : <li>No one assigned.</li>}
                    </ul>
                </div>
            </div>

            {/* Presenter Table */}
            <div className="mt-4">
                <h3 className="font-bold text-lg mb-2">Training Officer/Presenter</h3>
                <Table className="border">
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Venue</TableHead><TableHead>Signature</TableHead></TableRow></TableHeader>
                    <TableBody><TableRow><TableCell>{talk.leader}</TableCell><TableCell>{talk.department}</TableCell><TableCell>{talk.location}</TableCell><TableCell>{talk.leader}<br /><span className="text-xs text-gray-500">{format(new Date(talk.date), 'PPP p')}</span></TableCell></TableRow></TableBody>
                </Table>
            </div>
            
            {/* Duration */}
            <div className="mt-4 border-t border-b py-2 text-sm">
                <strong>Date and Duration:</strong> Start: {format(new Date(talk.date), 'PPP, h:mm a')}
            </div>

            {/* Topic Summary */}
            <div className="mt-4">
                <h3 className="font-bold text-lg mb-2">Topic Summary</h3>
                <SectionToTable text={talk.observations} />
            </div>

            {/* Attachments */}
            {talk.attachments && talk.attachments.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Paperclip /> Attachments</h3>
                    <div className="flex flex-col gap-2">
                        {talk.attachments.map(att => (
                            <Button key={att.url} variant="outline" asChild className="w-fit">
                                <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            
             {/* Attendance Record */}
            <div className="mt-8">
                <h3 className="font-bold text-lg mb-2">Attendance Record</h3>
                <Table className="border">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">Individual name (Printed)</TableHead>
                            <TableHead className="w-1/3">Company</TableHead>
                            <TableHead className="w-1/3">Signature</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {signatures.map(sig => (
                            <TableRow key={sig.id}>
                                <TableCell>{sig.name}</TableCell>
                                <TableCell>RDT360-Safety</TableCell>
                                <TableCell>
                                    <div className="relative h-12">
                                       <Image src={sig.signature_image_url} alt={`Signature of ${sig.name}`} layout="fill" objectFit="contain" className="object-left" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{format(new Date(sig.signed_at), 'PPP p')}</p>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
      </div>
    </AppShell>
  );
}
