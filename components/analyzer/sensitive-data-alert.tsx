import type { SensitiveDataDetectionResult } from '@/lib/privacy/sensitive-data-detector'

interface SensitiveDataAlertProps {
  detection: SensitiveDataDetectionResult
  workingLanguage: 'pl' | 'en'
}

export function SensitiveDataAlert({ detection, workingLanguage }: SensitiveDataAlertProps) {
  if (detection.riskLevel === 'none') return null

  const borderClass = 
    detection.riskLevel === 'high' ? 'border-pp-danger shadow-[4px_4px_0px_rgba(239,68,68,0.15)] bg-red-950/10' :
    detection.riskLevel === 'medium' ? 'border-pp-warning shadow-[4px_4px_0px_rgba(245,158,11,0.15)] bg-amber-950/10' :
    'border-pp-border shadow-[4px_4px_0px_rgba(0,0,0,0.3)] bg-pp-panel';

  const riskLabelClass =
    detection.riskLevel === 'high' ? 'text-pp-danger' :
    detection.riskLevel === 'medium' ? 'text-pp-warning' :
    'text-pp-cyan';

  return (
    <div className={`border-2 p-5 text-xs flex flex-col sm:flex-row gap-4 font-mono ${borderClass}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 ${
        detection.riskLevel === 'high' ? 'border-pp-danger bg-pp-danger/10 text-pp-danger' :
        detection.riskLevel === 'medium' ? 'border-pp-warning bg-pp-warning/10 text-pp-warning' :
        'border-pp-border bg-pp-panel text-pp-cyan'
      } font-bold`}>
        {detection.riskLevel === 'high' ? '!' : '?'}
      </div>
      
      <div className="flex-1 space-y-2">
        <p className={`font-black text-sm uppercase tracking-wider ${riskLabelClass}`}>
          {detection.riskLevel === 'high' 
            ? (workingLanguage === 'pl' ? 'Zablokowano: Wykryto dane krytyczne' : 'Blocked: High-Risk Credentials Detected') :
           detection.riskLevel === 'medium' 
            ? (workingLanguage === 'pl' ? 'Ostrzeżenie: Potencjalne dane poufne' : 'Warning: Potential Secrets Found') :
           (workingLanguage === 'pl' ? 'Informacja: Zidentyfikowano dane kontaktowe' : 'Notice: Contact Identifiers Identified')}
        </p>
        
        <p className="text-pp-muted leading-relaxed break-words text-[11px]">
          {detection.riskLevel === 'high' 
            ? (workingLanguage === 'pl' ? 'Nasz skaner preflight zidentyfikował wzorce krytycznych danych wrażliwych (np. kluczy API lub haseł). Aby odblokować audyt, usuń je ze swojego promptu:' : 'Our safety preflight scan identified high-risk secret patterns. To unlock the audit button, please remove them from your prompt:') :
           detection.riskLevel === 'medium' 
            ? (workingLanguage === 'pl' ? 'Wykryliśmy wzorce o średnim poziomie ryzyka (np. hasła). Zalecamy upewnić się, że nie są to dane produkcyjne przed kontynuacją:' : 'We detected medium-risk parameters (e.g. passwords). We highly recommend verifying these are non-production placeholders:') :
           (workingLanguage === 'pl' ? 'Wykryliśmy podstawowe dane kontaktowe (np. adres e-mail). Narzędzie działa w 100% anonimowo, ale zalecamy ostrożność:' : 'We detected common contact details (e.g. email). Although this tool is 100% anonymous, please stay cautious:')}
        </p>

        <ul className="mt-3 space-y-3">
          {detection.findings.map((finding, idx) => (
            <li key={`${finding.type}-${idx}`} className="pp-inset p-3 bg-black/30 border border-pp-border flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                  finding.riskLevel === 'high' ? 'border-pp-danger bg-pp-danger/10 text-pp-danger' :
                  finding.riskLevel === 'medium' ? 'border-pp-warning bg-pp-warning/10 text-pp-warning' :
                  'border-pp-border bg-pp-panel text-pp-cyan'
                }`}>
                  {finding.riskLevel === 'high' ? (workingLanguage === 'pl' ? 'Krytyczne' : 'Critical') : finding.riskLevel === 'medium' ? (workingLanguage === 'pl' ? 'Ostrzeżenie' : 'Warning') : 'Info'}
                </span>
                <span className="font-mono text-xs font-bold text-pp-text break-all">{finding.redactedValue}</span>
              </div>
              <p className="text-[10px] text-pp-muted leading-normal font-medium">{finding.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
