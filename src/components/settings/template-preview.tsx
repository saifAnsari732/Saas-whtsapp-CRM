import { Eye, ImageIcon, ExternalLink, Phone, Undo2, Copy } from 'lucide-react';
import type { TemplateButton } from '@/types';

const renderButtonIcon = (type: TemplateButton['type']) => {
  switch (type) {
    case 'QUICK_REPLY': return <Undo2 className="h-3.5 w-3.5 mr-2" />;
    case 'URL': return <ExternalLink className="h-3.5 w-3.5 mr-2" />;
    case 'PHONE_NUMBER': return <Phone className="h-3.5 w-3.5 mr-2" />;
    case 'COPY_CODE': return <Copy className="h-3.5 w-3.5 mr-2" />;
    default: return null;
  }
};

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

  const isCarousel = headerType === 'CAROUSEL';
  const hasCards = cards && cards.length > 0;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Preview Header */}
      <div className="bg-[#00a884] text-white px-4 py-3 flex items-center gap-3 rounded-xl">
        <div className="bg-white/20 p-2 rounded-full">
          <Eye className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-semibold leading-tight">Preview</p>
          <p className="text-[13px] text-white/90">Live template preview</p>
        </div>
      </div>

      {/* WhatsApp Chat Window */}
      <div
        className="flex-1 rounded-xl border border-border overflow-hidden flex flex-col shadow-sm"
        style={{ backgroundColor: 'rgba(239, 234, 226, 0.95)' }}
      >
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[320px]">

          {isCarousel ? (
            <div className="flex flex-col gap-3">
              {/* Carousel body text bubble */}
              {bodyText && (
                <div className="ml-auto max-w-[90%] rounded-lg bg-[#dcf8c6] shadow-sm overflow-hidden relative pb-5">
                  <div className="px-3 py-2">
                    <p className="whitespace-pre-wrap text-[13px] text-[#111b21] leading-[18px]">{previewText}</p>
                  </div>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[10px] text-[#667781]">12:00</span>
                    <span className="text-[10px] text-[#53bdeb]">✓✓</span>
                  </div>
                </div>
              )}

              {/* Carousel cards row */}
              {hasCards ? (
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x" style={{ scrollbarWidth: 'none' }}>
                  {cards!.map((card, idx) => (
                    <div key={idx} className="min-w-[180px] max-w-[180px] snap-center rounded-lg bg-white shadow-sm flex flex-col border border-black/5 overflow-hidden">
                      {card.header_media_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.header_media_url as string}
                          alt={`Card ${idx + 1}`}
                          className="w-full h-24 object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center text-[10px] text-[#667781] gap-1">
                          <ImageIcon className="h-5 w-5 opacity-40" />
                          <span>Card {idx + 1}</span>
                        </div>
                      )}
                      <div className="px-2 py-1.5 flex-1">
                        <p className="whitespace-pre-wrap text-[12px] text-[#111b21] leading-[16px]">
                          {(card.body_text as string)?.replace(/\{\{\d+\}\}/g, (m: string) => `[${m}]`) || (
                            <span className="italic text-[#667781] opacity-60">Card description...</span>
                          )}
                        </p>
                      </div>
                      {buttons && buttons.length > 0 && (
                        <div className="flex flex-col border-t border-black/5 bg-white">
                          {buttons.map((btn, bIdx) => (
                            <div key={bIdx} className="w-full flex items-center justify-center py-2 border-b border-black/5 last:border-0 text-[12px] text-[#00a884] font-medium cursor-pointer">
                              {renderButtonIcon(btn.type)}
                              <span>{btn.text || 'Button'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Placeholder when no cards yet */
                <div className="flex gap-2 overflow-hidden pb-1">
                  {[1, 2].map((n) => (
                    <div key={n} className="min-w-[160px] rounded-lg bg-white shadow-sm flex flex-col border border-dashed border-black/20 overflow-hidden opacity-40">
                      <div className="w-full h-20 bg-gray-100 flex flex-col items-center justify-center text-[10px] text-[#667781] gap-1">
                        <ImageIcon className="h-5 w-5 opacity-40" />
                        <span>Card {n}</span>
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Standard template bubble */
            <div className="ml-auto max-w-[90%] min-w-[55%] rounded-lg bg-[#dcf8c6] shadow-sm flex flex-col relative overflow-hidden pb-5">
              {/* Header media */}
              {(headerType === 'image' || headerType === 'video' || headerType === 'document') && (
                <div className="w-full h-36 bg-black/5 flex items-center justify-center text-xs text-[#667781] overflow-hidden">
                  {headerMediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerMediaUrl} alt="Header preview" className="w-full h-full object-contain bg-white" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 opacity-50">
                      <ImageIcon className="h-8 w-8" />
                      <span>{headerType.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="px-3 py-2">
                <p className="whitespace-pre-wrap text-[13px] text-[#111b21] leading-[18px]">
                  {previewText || <span className="italic opacity-50">Type your message...</span>}
                </p>
                {footerText && (
                  <p className="text-[11px] text-[#667781] mt-1 leading-[16px]">{footerText}</p>
                )}
              </div>

              <div className="absolute bottom-1 right-2 flex items-center gap-1">
                <span className="text-[10px] text-[#667781]">12:00</span>
                <span className="text-[10px] text-[#53bdeb]">✓✓</span>
              </div>

              {buttons && buttons.length > 0 && (
                <div className="mt-1 flex flex-col border-t border-black/5 bg-white rounded-b-lg">
                  {buttons.map((btn, idx) => (
                    <div key={idx} className="w-full flex items-center justify-center py-2.5 border-b border-black/5 last:border-0 text-[13px] text-[#00a884] font-medium cursor-pointer hover:bg-black/5 transition-colors">
                      {renderButtonIcon(btn.type)}
                      <span>{btn.text || (btn.type === 'URL' ? 'Visit Website' : btn.type === 'PHONE_NUMBER' ? 'Call Phone' : btn.type === 'COPY_CODE' ? 'Copy Offer Code' : 'Button')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-2 border-t border-black/5">
          <div className="flex-1 bg-white rounded-full px-4 py-1.5 text-[13px] text-[#8696a0]">
            Type a message...
          </div>
          <div className="bg-[#00a884] text-white p-2 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
