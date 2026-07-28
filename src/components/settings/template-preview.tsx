import { Eye } from 'lucide-react';
import type { TemplateButton } from '@/types';

interface TemplatePreviewProps {
  bodyText: string;
  headerType: string;
  headerMediaUrl?: string;
  footerText?: string;
  buttons?: TemplateButton[];
  cards?: Record<string, unknown>[];
}

export function TemplatePreview({
  bodyText,
  headerType,
  headerMediaUrl,
  footerText,
  buttons,
  cards,
}: TemplatePreviewProps) {
  // Replace {{1}}, {{2}} with placeholder badges
  const previewText = bodyText?.replace(/\{\{\d+\}\}/g, (match) => {
    return `[${match}]`;
  }) || '';

  return (
    <div className="sticky top-6 rounded-xl border border-border bg-card shadow-sm h-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="bg-[#00a884] text-white px-4 py-3 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Eye className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-semibold leading-tight">Preview</p>
          <p className="text-[13px] text-white/90">Live template preview</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#efeae2] p-4 flex flex-col gap-2 min-h-[400px]" style={{ backgroundImage: 'url("https://wacrm.net/wa-pattern.png")', backgroundSize: '400px', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(239, 234, 226, 0.9)' }}>
        {headerType === 'CAROUSEL' && cards && cards.length > 0 ? (
          <div className="flex flex-col gap-3">
            {bodyText && (
              <div className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] shadow-sm overflow-hidden relative pb-4">
                <div className="px-3 py-2">
                  <p className="whitespace-pre-wrap text-[14.2px] text-[#111b21] leading-[19px]">
                    {previewText}
                  </p>
                </div>
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                  <span className="text-[11px] text-[#667781]">12:00</span>
                  <span className="text-[11px] text-[#53bdeb]">✓✓</span>
                </div>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {cards.map((card, idx) => (
                <div key={idx} className="min-w-[240px] max-w-[240px] snap-center rounded-lg bg-white shadow-sm flex flex-col border border-black/5 overflow-hidden">
                  {card.header_media_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.header_media_url as string}
                      alt={`Card ${idx + 1}`}
                      className="w-full h-32 object-contain bg-white"
                    />
                  ) : (
                    <div className="w-full h-32 bg-black/5 flex items-center justify-center text-xs text-[#667781]">
                      Image {idx + 1}
                    </div>
                  )}
                  <div className="px-3 py-2 flex-1">
                    <p className="whitespace-pre-wrap text-[14.2px] text-[#111b21] leading-[19px]">
                      {(card.body_text as string)?.replace(/\{\{\d+\}\}/g, (m: string) => `[${m}]`) || ''}
                    </p>
                  </div>
                  {buttons && buttons.length > 0 && (
                    <div className="flex flex-col border-t border-black/5 bg-white">
                      {buttons.map((btn, bIdx) => (
                        <div key={bIdx} className="w-full py-[10px] border-b border-black/5 last:border-0 text-center text-[14.2px] text-[#00a884] bg-white hover:bg-black/5 font-medium cursor-pointer transition-colors">
                          {btn.text || (btn.type === 'URL' ? 'Visit Website' : btn.type === 'PHONE_NUMBER' ? 'Call Phone' : btn.type === 'COPY_CODE' ? 'Copy Offer Code' : 'Button')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="ml-auto max-w-[85%] min-w-[60%] rounded-lg bg-[#dcf8c6] shadow-sm flex flex-col relative overflow-hidden pb-4">
            {(headerType === 'image' || headerType === 'video' || headerType === 'document') && (
              <div className="w-full h-40 bg-black/5 flex items-center justify-center text-xs text-[#667781] overflow-hidden p-1 pb-0">
                {headerMediaUrl ? (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={headerMediaUrl} alt="Header preview" className="w-full h-full object-contain bg-white rounded-t-md" />
                ) : (
                  <span>{headerType.toUpperCase()}</span>
                )}
              </div>
            )}
            
            <div className="px-3 py-2">
              <p className="whitespace-pre-wrap text-[14.2px] text-[#111b21] leading-[19px]">
                {previewText || <span className="italic opacity-50">Type your message...</span>}
              </p>

              {footerText && (
                <p className="text-[12.5px] text-[#667781] mt-1 leading-[18px]">
                  {footerText}
                </p>
              )}
            </div>

            <div className="absolute bottom-1 right-2 flex items-center gap-1">
              <span className="text-[11px] text-[#667781]">12:00</span>
              <span className="text-[11px] text-[#53bdeb]">✓✓</span>
            </div>

            {buttons && buttons.length > 0 && (
              <div className="mt-1 flex flex-col border-t border-black/5 bg-white">
                {buttons.map((btn, idx) => (
                  <div key={idx} className="w-full py-[10px] border-b border-black/5 last:border-0 text-center text-[14.2px] text-[#00a884] bg-white hover:bg-black/5 font-medium cursor-pointer transition-colors">
                    {btn.text || (btn.type === 'URL' ? 'Visit Website' : btn.type === 'PHONE_NUMBER' ? 'Call Phone' : btn.type === 'COPY_CODE' ? 'Copy Offer Code' : 'Button')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-[#f0f2f5] p-3 flex items-center border-t border-border mt-auto">
        <div className="flex-1 bg-white rounded-full px-4 py-2 text-[14.2px] text-[#8696a0]">
          Type a message...
        </div>
        <div className="ml-2 bg-[#00a884] text-white p-2.5 rounded-full flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
