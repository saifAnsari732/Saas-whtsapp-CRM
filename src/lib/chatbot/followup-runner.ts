import { getChatbotConfig, getFollowUpQueue, queueFollowUp } from './storage';
import { formatVariables } from './processor';
import { FollowUpQueueItem } from './types';

/**
 * Executes pending follow-up messages across accounts that have reached their scheduled time
 */
export async function runPendingFollowUps(): Promise<{ sent: number; checked: number }> {
  let sentCount = 0;
  let checkedCount = 0;

  if (!global.globalFollowUpQueue) return { sent: 0, checked: 0 };

  const now = new Date();

  for (const [accountId, items] of Object.entries(global.globalFollowUpQueue)) {
    const config = await getChatbotConfig(accountId);
    if (!config.is_active || !config.follow_up_sequence?.is_active) continue;

    for (const item of items) {
      if (item.status !== 'pending') continue;
      checkedCount++;

      const scheduledDate = new Date(item.scheduled_at);
      if (scheduledDate <= now) {
        // Time to dispatch follow-up!
        try {
          const socket = global.waSockets ? Object.values(global.waSockets)[0] : null;
          const formattedMessage = formatVariables(item.message_text, {
            name: item.contact_name,
            phone: item.contact_jid.split('@')[0],
          });

          let dispatched = false;
          if (socket) {
            await socket.sendMessage(item.contact_jid, { text: formattedMessage });
            dispatched = true;
          }

          if (dispatched) {
            item.status = 'sent';
            sentCount++;

            // Check if there is a subsequent step in the sequence
            const nextStepNum = item.step_number + 1;
            const nextStep = config.follow_up_sequence.steps.find(
              (s) => s.step_number === nextStepNum && s.is_active
            );

            if (nextStep) {
              let nextDelayMs = nextStep.delay_value * 60 * 1000;
              if (nextStep.delay_unit === 'hours') nextDelayMs = nextStep.delay_value * 3600 * 1000;
              else if (nextStep.delay_unit === 'days') nextDelayMs = nextStep.delay_value * 86400 * 1000;

              const nextQueueItem: FollowUpQueueItem = {
                id: `fq-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                contact_jid: item.contact_jid,
                contact_name: item.contact_name,
                step_number: nextStepNum,
                message_text: nextStep.message_text,
                scheduled_at: new Date(Date.now() + nextDelayMs).toISOString(),
                status: 'pending',
              };
              queueFollowUp(accountId, nextQueueItem);
            }
          }
        } catch (dispatchErr) {
          console.error(`[chatbot/followup-runner] Failed to dispatch follow-up to ${item.contact_jid}:`, dispatchErr);
        }
      }
    }
  }

  return { sent: sentCount, checked: checkedCount };
}
