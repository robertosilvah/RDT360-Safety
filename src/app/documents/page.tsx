import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockSafetyDocs } from '@/lib/mockData';
import { Upload, FileText, FileBadge, FileJson, FileQuestion } from 'lucide-react';
import Link from 'next/link';

const categoryIcons = {
    'Policy': <FileBadge className="h-8 w-8 text-primary" />,
    'Procedure': <FileJson className="h-8 w-8 text-accent" />,
    'Form': <FileText className="h-8 w-8 text-yellow-500" />,
    'Training Material': <FileQuestion className="h-8 w-8 text-blue-500" />,
}

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Document Hub</h2>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>
        <p className="text-muted-foreground">
            A central repository for safety policies, procedures, forms, and training materials.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockSafetyDocs.map((doc) => (
                <Card key={doc.doc_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">{doc.title}</CardTitle>
                        {categoryIcons[doc.category]}
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">{doc.category}</p>
                        <Button variant="link" asChild className="p-0 mt-4 h-auto">
                            <Link href={doc.file_url} target="_blank">View Document</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
