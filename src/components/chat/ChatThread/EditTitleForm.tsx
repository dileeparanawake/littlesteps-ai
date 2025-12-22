'use client';
import { authClient } from '@/lib/auth-client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useState } from 'react';

import { patchThreadTitle } from '@/lib/api/threads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    if (value.trim() === '') return;
    mutation.mutate();
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        aria-label="Edit thread title"
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        <Input
          className="flex-1"
          placeholder={displayTitle}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            aria-label="Cancel editing"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={mutation.isPending || value.trim() === ''}
            aria-label="Save thread title"
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
      {mutation.isError && (
        <p className="text-xs text-destructive">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Something went wrong'}
        </p>
      )}
    </div>
  );
}
