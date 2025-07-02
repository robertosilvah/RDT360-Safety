
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Siren } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, this would involve authentication logic.
    // For now, we just navigate to the dashboard.
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary">
                <Siren className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-2xl">RDT360-Safety</span>
                <span className="text-sm text-muted-foreground">Safety Insights</span>
            </div>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleLogin}>Sign in</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
