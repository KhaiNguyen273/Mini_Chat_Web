import type { Attachment } from './message.types'

export interface PinnedMessage {
  pin_id: string;
  pinned_at: string;
  pinned_by: { id: string; name: string };
  message: {
    id: string;
    content: string;
    type: string;
    created_at: string;
    sender: { id: string; name: string; avatar_url?: string };
    attachments: Attachment[];
  };
}