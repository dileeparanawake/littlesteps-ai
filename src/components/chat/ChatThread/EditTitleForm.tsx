'use client';
import { authClient } from '@/lib/auth-client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

import { patchThreadTitle } from '@/lib/api/threads';

export default function EditTitleForm({
  threadId,
  displayTitle,
  setEditing,
}: {
  threadId: string;
  displayTitle: string;
  setEditing: (editing: boolean) => void;
}) {
  const [value, setValue] = useState(displayTitle);

  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => patchThreadTitle({ threadId, title: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads', userId] });
      setEditing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form aria-label="Edit thread title" onSubmit={handleSubmit}>
      <input
        placeholder={displayTitle}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setEditing(false);
          }
        }}
      />

      {mutation.isPending && (
        <p className="text-xs text-muted-foreground mt-1">Saving...</p>
      )}
      {mutation.isError && (
        <p className="text-xs text-destructive mt-1">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Something went wrong'}
        </p>
      )}
    </form>
  );
}
