import Link from 'next/link';

export default function HeaderTitle() {
  return (
    <div className="leading-none">
      <h1 className="text-2xl font-bold leading-none tracking-tight m-0 mb-0.5">
        <Link
          href="/"
          className="no-underline text-foreground hover:text-primary transition-colors duration-200"
        >
          LittleSteps AI
        </Link>
      </h1>
      <p
        className="text-muted-foreground/70 leading-none tracking-tight m-0"
        style={{ fontSize: '0.7em' }}
      >
        Guidance for new parents
      </p>
    </div>
  );
}
