
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your personal information and password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="https://placehold.co/80x80" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Photo</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Sarah Miller" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="sarah.miller@example.com" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="Manager" disabled />
            </div>
            <Button>Update Profile</Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
