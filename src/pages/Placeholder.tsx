import { Construction } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

interface PlaceholderProps {
  title: string;
  descricao?: string;
}

export const Placeholder = ({ title, descricao }: PlaceholderProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold text-bokka-ink">{title}</h1>
      {descricao && <p className="text-sm text-bokka-ink-3 mt-1">{descricao}</p>}
    </div>
    <div className="bg-bokka-surface border border-bokka-border rounded-xl">
      <EmptyState
        icon={<Construction className="w-6 h-6" strokeWidth={1.75} />}
        title="Módulo em construção"
        description="Esta tela vai ser habilitada em breve. Enquanto isso, use os outros módulos."
      />
    </div>
  </div>
);
