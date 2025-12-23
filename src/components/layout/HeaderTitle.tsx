import Link from 'next/link';

export default function HeaderTitle() {
  return (
    <div className="leading-none">
      <h1 className="text-2xl text-foreground/90 font-semibold leading-none tracking-tight m-0 mb-0.5">
        <Link
          href="/"
          className="no-underline text-foreground/90 hover:text-primary transition-colors duration-200"
        >
          LittleSteps AI
        </Link>
      </h1>
      <p
        className="leading-none tracking-tight m-0 bg-gradient-to-r from-muted-foreground to-muted-foreground/80 bg-clip-text text-transparent font-normal"
        style={{ fontSize: '0.7em' }}
      >
        Guidance for new parents
      </p>
    </div>
  );
}
