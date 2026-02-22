import ReactMarkdown from 'react-markdown';

import { privacyNotice } from '@/content/privacy-notice';

export default function PrivacyPage() {
  return (
    <article className="max-w-prose mx-auto px-6 py-10">
      <div className="prose prose-sm sm:prose-base [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-sm [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:mb-4 [&_a]:underline [&_a]:text-primary [&_strong]:font-semibold [&_table]:text-sm [&_table]:w-full [&_table]:mb-4 [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_td]:p-2 [&_td]:border-b">
        <ReactMarkdown>{privacyNotice}</ReactMarkdown>
      </div>
    </article>
  );
}
