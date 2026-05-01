import { User } from './user.model';
import { Job } from './job.model';

export interface DirectMessage {
    id: number;
    sender: User;
    receiver: User;
    content: string;
    sentAt: string;
    isRead: boolean;
    job?: Job;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
}
