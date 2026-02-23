import ReactMarkdown from 'react-markdown';

import { privacyNotice } from '@/content/privacy-notice';

// Overrides for document-reading typography — scales down from app-sized
// base styles in globals.css to smaller, denser sizes suitable for a legal page.
const privacyNoticeStyles = [
  '[&_h1]:text-2xl',
  '[&_h2]:text-lg [&_h2]:mt-8',
  '[&_h3]:text-base [&_h3]:mt-6',
  '[&_p]:text-sm',
  '[&_li]:text-sm [&_li]:leading-relaxed',
  '[&_ul]:list-outside [&_ul]:pl-5',
  '[&_table]:text-sm [&_table]:w-full [&_table]:mb-4',
  '[&_th]:text-left [&_th]:p-2 [&_th]:border-b',
  '[&_td]:p-2 [&_td]:border-b',
].join(' ');

export default function PrivacyPage() {
  return (
    <article className="max-w-prose mx-auto px-6 py-10">
      <div className={privacyNoticeStyles}>
        <ReactMarkdown>{privacyNotice}</ReactMarkdown>
      </div>
    </article>
  );
}
