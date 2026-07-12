import type { SensitiveDataDetectionResult } from '@/lib/privacy/sensitive-data-detector'

interface SensitiveDataAlertProps {
  detection: SensitiveDataDetectionResult
  workingLanguage: 'pl' | 'en'
}

export function SensitiveDataAlert({ detection, workingLanguage }: SensitiveDataAlertProps) {
  if (detection.riskLevel === 'none') return null

  return (
    <div className={`rounded-xl border p-4 sm:p-5 text-xs flex gap-3.5 transition-all ${
      detection.riskLevel === 'high' ? 'border-[#F87171]/40 bg-[#F87171]/8 text-[#F87171] animate-shake' :
      detection.riskLevel === 'medium' ? 'border-[#F97316]/30 bg-[#F97316]/6 text-[#F97316]' :
      'border-[#2A2A3A] bg-[#13131A] text-[#94A3B8]'
    }`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
        detection.riskLevel === 'high' ? 'bg-[#F87171]/10 text-[#F87171]' :
        detection.riskLevel === 'medium' ? 'bg-[#F97316]/10 text-[#F97316]' :
        'bg-[#2A2A3A] text-[#94A3B8]'
      }`}>
        {detection.riskLevel === 'high' ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6h.01M5.938 18h12.124c1.348 0 2.19-1.46 1.516-2.61L13.516 6.39c-.674-1.15-2.358-1.15-3.032 0L4.422 15.39c-.674 1.15.168 2.61 1.516 2.61z" />
          </svg>
        ) : detection.riskLevel === 'medium' ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight">
          {detection.riskLevel === 'high' 
            ? (workingLanguage === 'pl' ? 'Zablokowano: Wykryto dane krytyczne' : 'Blocked: High-Risk Credentials Detected') :
           detection.riskLevel === 'medium' 
            ? (workingLanguage === 'pl' ? 'Ostrzeżenie: Potencjalne dane poufne' : 'Warning: Potential Secrets Found') :
           (workingLanguage === 'pl' ? 'Informacja: Zidentyfikowano dane kontaktowe' : 'Notice: Contact Identifiers Identified')}
        </p>
        <p className="mt-1 leading-relaxed break-words">
          {detection.riskLevel === 'high' 
            ? (workingLanguage === 'pl' ? 'Nasz skaner preflight zidentyfikował wzorce krytycznych danych wrażliwych (np. kluczy API lub haseł). Aby odblokować audyt, usuń je ze swojego promptu:' : 'Our safety preflight scan identified high-risk secret patterns. To unlock the audit button, please remove them from your prompt:') :
           detection.riskLevel === 'medium' 
            ? (workingLanguage === 'pl' ? 'Wykryliśmy wzorce o średnim poziomie ryzyka (np. hasła). Zalecamy upewnić się, że nie są to dane produkcyjne przed kontynuacją:' : 'We detected medium-risk parameters (e.g. passwords). We highly recommend verifying these are non-production placeholders:') :
           (workingLanguage === 'pl' ? 'Wykryliśmy podstawowe dane kontaktowe (np. adres e-mail). Narzędzie działa w 100% anonimowo, ale zalecamy ostrożność:' : 'We detected common contact details (e.g. email). Although this tool is 100% anonymous, please stay cautious:')}
        </p>
        <ul className="mt-3.5 space-y-2.5">
          {detection.findings.map((finding, idx) => (
            <li key={`${finding.type}-${idx}`} className="rounded-lg border border-[#2A2A3A] bg-[#1C1C27] p-3 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                  finding.riskLevel === 'high' ? 'bg-[#F87171]/15 text-[#F87171]' :
                  finding.riskLevel === 'medium' ? 'bg-[#F97316]/15 text-[#F97316]' :
                  'bg-[#2A2A3A] text-[#94A3B8]'
                }`}>
                  {finding.riskLevel === 'high' ? (workingLanguage === 'pl' ? 'Krytyczne' : 'Critical') : finding.riskLevel === 'medium' ? (workingLanguage === 'pl' ? 'Ostrzeżenie' : 'Warning') : 'Info'}
                </span>
                <span className="font-mono text-xs font-bold text-[#E2E8F0] break-all">{finding.type}</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-normal font-medium">{finding.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
