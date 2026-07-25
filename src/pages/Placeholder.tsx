interface PlaceholderProps {
  title: string;
  descricao?: string;
}

export const Placeholder = ({ title, descricao }: PlaceholderProps) => (
  <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      {descricao && <p className="text-sm text-slate-500">{descricao}</p>}
    </div>
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="text-sm">Módulo em construção.</p>
      <p className="text-xs text-slate-400 mt-1">
        Esta tela será implementada em uma próxima etapa.
      </p>
    </div>
  </div>
);
