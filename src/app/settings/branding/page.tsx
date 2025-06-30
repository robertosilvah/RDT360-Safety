'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BrandingSettingsPage() {
  const { brandingSettings, updateBrandingSettings, uploadSettings } = useAppData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeMB = uploadSettings?.imageMaxSizeMB || 2; // Default to 2MB for logos
      const maxSizeInBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `The logo image must be smaller than ${maxSizeMB}MB.`,
        });
        if (event.target) event.target.value = '';
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a logo file to upload.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await updateBrandingSettings(selectedFile);
      toast({
        title: 'Logo updated',
        description: 'Your new company logo has been saved.',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'There was an error uploading your logo. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentLogo = previewUrl || brandingSettings?.logoUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Settings</CardTitle>
        <CardDescription>Customize the look and feel of the application with your company's branding.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-6">
                 <div className="relative h-20 w-20 rounded-md border flex items-center justify-center bg-muted/50">
                    {currentLogo ? (
                        <Image src={currentLogo} alt="Company Logo" layout="fill" objectFit="contain" className="p-2" />
                    ) : (
                        <Skeleton className="h-full w-full" />
                    )}
                 </div>
                 <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleFileChange} className="max-w-xs" />
            </div>
             <p className="text-sm text-muted-foreground">Upload a PNG, JPG, or SVG file. Recommended size: 256x256 pixels.</p>
        </div>
      </CardContent>
       <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={!selectedFile || isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Save Logo
        </Button>
      </CardFooter>
    </Card>
  );
}
