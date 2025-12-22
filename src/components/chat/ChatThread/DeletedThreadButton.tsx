'use client';

import { Trash2 } from 'lucide-react';
import { deleteThreadApi } from '@/lib/api/threads';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

import { useRouter } from 'next/navigation';

export default function DeletedThreadButton({
  threadId,
}: {
  threadId: string;
}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => deleteThreadApi(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', userId] });

      router.replace('/chat');
    },
  });
  const handleClick = () => {
    mutation.mutate();
  };
  if (mutation.isPending) {
    return <p className="text-xs text-muted-foreground mt-1">Deleting...</p>;
  }
  if (mutation.isError) {
    return (
      <p className="text-xs text-destructive mt-1">
        {mutation.error instanceof Error
          ? mutation.error.message
          : 'Something went wrong'}
      </p>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger
        aria-label="Delete thread"
        className="opacity-70 hover:opacity-100 transition-opacity p-1"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors duration-200" strokeWidth={1.5} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your chat
            thread and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClick}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
