interface ProductModerationHeaderProps {
  title: string;
  description: string;
}

export function ProductModerationHeader({ title, description }: ProductModerationHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </header>
  );
}
