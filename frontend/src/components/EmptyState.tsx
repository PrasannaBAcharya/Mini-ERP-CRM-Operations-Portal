import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
}) => (
  <div className="empty-state">
    <span className="empty-state-icon">{icon}</span>
    <div className="empty-state-title">{title}</div>
    {description && <p className="empty-state-desc">{description}</p>}
    {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
  </div>
);

export default EmptyState;
