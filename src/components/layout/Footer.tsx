export default function Footer() {
  return (
    <footer className="flex justify-center items-center gap-4 px-6 py-2 bg-muted border-t border-border/50">
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
      >
        Privacy
      </a>
      <a
        href="https://github.com/dileeparanawake/littlesteps-ai"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
      >
        GitHub
      </a>
      <a
        href="https://www.linkedin.com/in/dileepa-ranawake/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
      >
        LinkedIn
      </a>
    </footer>
  );
}
