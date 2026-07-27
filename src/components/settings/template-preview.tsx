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
    <div className="sticky top-6 rounded-xl border border-border bg-card/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Eye className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Live Preview</p>
      </div>

      <div className="rounded-lg bg-[#0e1a12] p-4 flex flex-col gap-2 min-h-[400px]">
        {headerType === 'CAROUSEL' && cards && cards.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {cards.map((card, idx) => (
              <div key={idx} className="min-w-[240px] max-w-[240px] snap-center rounded-lg bg-primary/20 px-3 py-2 shadow-sm flex flex-col gap-2 border border-primary/30">
                {card.header_media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.header_media_url}
                    alt={`Card ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-32 bg-black/20 rounded-md flex items-center justify-center text-xs text-muted-foreground">
                    Image {idx + 1}
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm text-primary">
                  {(card.body_text as string)?.replace(/\{\{\d+\}\}/g, (m: string) => `[${m}]`) || ''}
                </p>
                {(card.buttons as Record<string, unknown>[])?.map((btn: Record<string, unknown>, bIdx: number) => (
                  <div key={bIdx} className="w-full py-1.5 mt-1 border-t border-primary/20 text-center text-[13px] text-blue-400 font-medium">
                    {btn.text as string}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="ml-auto max-w-[85%] rounded-lg bg-primary/30 px-3 py-2 shadow-sm flex flex-col gap-1">
            {(headerType === 'image' || headerType === 'video' || headerType === 'document') && (
              <div className="w-full h-32 bg-black/20 rounded-md flex items-center justify-center text-xs text-muted-foreground overflow-hidden mb-1">
                {headerMediaUrl ? (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={headerMediaUrl} alt="Header preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{headerType.toUpperCase()}</span>
                )}
              </div>
            )}
            
            <p className="whitespace-pre-wrap text-[15px] text-primary">
              {previewText || <span className="italic opacity-50">Type your message...</span>}
            </p>

            {footerText && (
              <p className="text-[11px] text-primary/60 mt-1 uppercase tracking-wide">
                {footerText}
              </p>
            )}

            {buttons && buttons.length > 0 && (
              <div className="mt-2 flex flex-col border-t border-primary/20">
                {buttons.map((btn, idx) => (
                  <div key={idx} className="w-full py-2 border-b border-primary/20 last:border-0 text-center text-[14px] text-blue-400 font-medium cursor-default">
                    {btn.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
