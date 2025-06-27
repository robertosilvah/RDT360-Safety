'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { UserPlus, Check, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(['Administrator', 'Manager', 'Operator', 'Maintenance', 'HR']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const AddUserForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addUser } = useAppData();
  const { toast } = useToast();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: '', email: '', role: 'Operator' },
  });

  const onSubmit = (values: UserFormValues) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      status: 'Pending', // New users are pending approval
      ...values,
    };
    addUser(newUser);
    toast({
      title: 'User Invited',
      description: `${values.name} has been invited and is pending approval.`,
    });
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Invite a new user to the platform. They will be pending approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Operator">Operator</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Invite User</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


export default function UserManagementPage() {
  const { users, updateUserStatus, removeUser } = useAppData();
  const [isAddUserOpen, setAddUserOpen] = useState(false);
  const { toast } = useToast();

  const handleApprove = (userId: string) => {
    updateUserStatus(userId, 'Active');
    toast({ title: 'User Approved', description: 'The user now has active access.' });
  };
  
  const handleDeny = (userId: string) => {
    removeUser(userId);
    toast({ variant: 'destructive', title: 'User Denied', description: 'The user access request has been denied and removed.' });
  };

  const statusVariant: { [key in User['status']]: 'secondary' | 'default' } = {
    'Pending': 'secondary',
    'Active': 'default',
  };

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A list of all users, including those pending approval.</CardDescription>
          </div>
          <Dialog open={isAddUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddUserForm setOpen={setAddUserOpen} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell><Badge variant={statusVariant[user.status]}>{user.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {user.status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleApprove(user.id)}>
                          <Check className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <XCircle className="mr-2 h-4 w-4" /> Deny
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently deny access for {user.name}. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeny(user.id)}>Deny Access</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm">Edit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}
