export function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div className="page-header-group">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
