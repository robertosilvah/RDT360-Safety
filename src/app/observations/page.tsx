'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockObservations } from '@/lib/mockData';
import type { Observation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';

export default function ObservationsPage() {
    
  const statusVariant: { [key in Observation['status']]: 'outline' | 'default' } = {
    'Open': 'default',
    'Closed': 'outline',
  };

  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would handle the form submission,
    // including uploading the image file.
    console.log({ location, details, file: selectedFile });
    alert('Observation submitted!');
    // Reset form
    setLocation('');
    setDetails('');
    setSelectedFile(null);
    setImagePreview(null);
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Safety Observations</h2>
        
        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Submit an Observation</CardTitle>
                        <CardDescription>Report a safety concern or a positive observation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location / Area</Label>
                                <Input 
                                    id="location" 
                                    placeholder="e.g., Warehouse Section B" 
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="details">Details</Label>
                                <Textarea 
                                    id="details" 
                                    placeholder="Describe what you observed..." 
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="photo">Attach Photo</Label>
                                <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                            {imagePreview && (
                                <div className="mt-4 relative w-full aspect-video">
                                    <Image src={imagePreview} alt="Observation preview" fill className="rounded-md object-cover" data-ai-hint="observation photo" />
                                </div>
                            )}
                            <Button type="submit" className="w-full">Submit Observation</Button>
                        </form>
                    </CardContent>
                 </Card>
            </div>
            <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Observation History</CardTitle>
                    <CardDescription>A list of all submitted safety observations.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Photo</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Submitted By</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockObservations.map((obs) => (
                          <TableRow key={obs.observation_id}>
                            <TableCell className="font-medium">{obs.observation_id}</TableCell>
                            <TableCell>
                              {obs.imageUrl ? (
                                <div className="w-16 h-12 relative">
                                    <Image src={obs.imageUrl} alt={`Observation ${obs.observation_id}`} fill className="rounded-md object-cover" data-ai-hint="safety observation" />
                                </div>
                              ) : (
                                <div className="w-16 h-12 flex items-center justify-center bg-muted rounded-md">
                                    <Camera className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{new Date(obs.date).toLocaleDateString()}</TableCell>
                            <TableCell>{obs.location}</TableCell>
                            <TableCell>{obs.submitted_by}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant[obs.status]}>{obs.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </AppShell>
  );
}
