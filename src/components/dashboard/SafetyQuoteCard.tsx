'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Edit, Quote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

type Comment = {
  user: string;
  comment: string;
  date: string;
};

export function SafetyQuoteCard() {
  const [quote, setQuote] = useState<{ text: string; author: string }>({
    text: "The safe way is the only way.",
    author: "Unknown"
  });
  const [comments, setComments] = useState<Comment[]>([
    { user: 'John Doe', comment: 'Great reminder for everyone!', date: new Date(Date.now() - 86400000 * 2).toISOString() },
  ]);
  const [newComment, setNewComment] = useState('');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState(quote.text);
  const [newQuoteAuthor, setNewQuoteAuthor] = useState(quote.author);
  const { toast } = useToast();

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments(prev => [
        ...prev,
        { user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString() }
      ]);
      setNewComment('');
    }
  };

  const handleUpdateQuote = () => {
    if (newQuoteText.trim()) {
      setQuote({ text: newQuoteText, author: newQuoteAuthor });
      toast({
        title: "Quote Updated",
        description: "The safety quote of the week has been changed."
      });
      setDialogOpen(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Safety Quote of the Week</CardTitle>
          <CardDescription>A weekly dose of safety inspiration.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Quote of the Week</DialogTitle>
              <DialogDescription>Enter a new quote and its author below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter the new quote..."
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                rows={4}
              />
              <Input
                placeholder="Author (e.g., Anonymous)"
                value={newQuoteAuthor}
                onChange={(e) => setNewQuoteAuthor(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateQuote}>Update Quote</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <blockquote className="mt-2 border-l-2 pl-6 italic">
            <Quote className="h-6 w-6 text-muted-foreground inline-block mr-2 -mt-2" />
            "{quote.text}"
            <footer className="text-sm mt-2">- {quote.author || 'Unknown'}</footer>
        </blockquote>
        <div className="space-y-4 pt-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Team Discussion
          </h4>
          <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
            {comments.map((comment, index) => (
              <div key={index} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://placehold.co/32x32.png?text=${comment.user.charAt(0)}`} data-ai-hint="user avatar" />
                  <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{comment.user}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.date), { addSuffix: true })}</p>
                  </div>
                  <p className="text-sm text-muted-foreground bg-secondary p-2 rounded-lg mt-1">{comment.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t flex gap-2">
        <Textarea
          placeholder="Add your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={1}
          className="flex-1"
        />
        <Button onClick={handleAddComment} disabled={!newComment.trim()}>Send</Button>
      </CardFooter>
    </Card>
  );
}
