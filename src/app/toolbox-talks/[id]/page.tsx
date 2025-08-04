
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { ToolboxTalk, ToolboxSignature, TalkSection } from '@/types';
import { Clock, User, MapPin, Edit, Check, Link as LinkIcon, Printer, QrCode, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import SignaturePad from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/services/backend';

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
        <Button>
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

export default function TalkDetailsPage({ params }: { params: { id: string } }) {
  const { toolboxTalks } = useAppData();
  const [talk, setTalk] = useState<ToolboxTalk | null | undefined>(undefined);
  const [signatures, setSignatures] = useState<ToolboxSignature[]>([]);
  const router = useRouter();

  useEffect(() => {
    const foundTalk = toolboxTalks.find(t => t.id === params.id);
    setTalk(foundTalk);
  }, [params.id, toolboxTalks]);

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

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{talk.title}</CardTitle>
                <CardDescription>Toolbox Talk Details - {talk.display_id}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <QrCodeDialog url={typeof window !== 'undefined' ? window.location.href : ''} talk={talk} />
                 <Button variant="outline" size="icon" onClick={handleCopyLink}><LinkIcon className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{format(new Date(talk.date), 'PPP p')}</span></div>
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>Leader: {talk.leader}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>Location: {talk.location}</span></div>
              <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-muted-foreground" /><span>Department: {talk.department}</span></div>
            </div>
            <Separator />
            <div className="space-y-4">
                <div><h4 className="font-semibold mb-2">General Topics Discussed</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{talk.observations}</p></div>
                <TalkSectionDisplay section={talk.accidents_near_misses} title="1) Accidents or Near Misses Discussed" />
                <TalkSectionDisplay section={talk.unsafe_conditions} title="2) Unsafe or At-Risk Conditions" />
                <TalkSectionDisplay section={talk.corrections_changed_procedures} title="3) Corrected Conditions or Changed Procedures" />
                <TalkSectionDisplay section={talk.special_ppe} title="4) Special Care and Additional PPE" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Attendance & Signatures ({signatures.length})</CardTitle>
                    <SignatureDialog talk={talk} onSignatureSaved={() => {}} />
                </div>
                <CardDescription>Record of all personnel who have attended and acknowledged this talk.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {signatures.map(sig => (
                        <div key={sig.id} className="flex items-center gap-4 p-3 border rounded-md">
                            <div className="relative w-24 h-12 bg-gray-100 rounded-md">
                                <Image src={sig.signature_image_url} alt={`Signature of ${sig.name}`} layout="fill" objectFit="contain" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{sig.name}</p>
                                <p className="text-xs text-muted-foreground">Signed: {format(new Date(sig.signed_at), 'P p')}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 {signatures.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No signatures have been recorded yet.</div>
                )}
            </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
