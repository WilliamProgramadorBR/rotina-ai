import { api } from "./api";
import {
  CollaborationGroup,
  CollaborationInvite,
  CollaborationMessage,
  CollaborationPresence,
  Reminder,
  ReminderComment,
  Schedule,
  ScheduleSuggestion
} from "../types/entities";

export async function listCollaborationGroupsRequest() {
  const { data } = await api.get<{ groups: CollaborationGroup[] }>("/collaboration/groups");
  return data.groups;
}

export async function getCollaborationGroupRequest(groupId: string) {
  const { data } = await api.get<{ group: CollaborationGroup }>(`/collaboration/groups/${groupId}`);
  return data.group;
}

export async function createCollaborationGroupRequest(payload: {
  name: string;
  description?: string;
}) {
  const { data } = await api.post<{ group: CollaborationGroup }>("/collaboration/groups", payload);
  return data.group;
}

export async function inviteCollaborationMemberRequest(groupId: string, payload: {
  email: string;
  message?: string;
}) {
  const { data } = await api.post<{ invite: CollaborationInvite }>(
    `/collaboration/groups/${groupId}/invites`,
    payload
  );
  return data.invite;
}

export async function leaveCollaborationGroupRequest(groupId: string) {
  const { data } = await api.delete<{ message: string; groupDeleted: boolean }>(
    `/collaboration/groups/${groupId}/membership`
  );
  return data;
}

export async function listCollaborationMessagesRequest(groupId: string) {
  const { data } = await api.get<{
    messages: CollaborationMessage[];
    presence: CollaborationPresence[];
    onlineCount: number;
  }>(`/collaboration/groups/${groupId}/chat`);
  return data;
}

export async function pingCollaborationPresenceRequest(groupId: string) {
  const { data } = await api.post<{
    presence: CollaborationPresence[];
    onlineCount: number;
  }>(`/collaboration/groups/${groupId}/presence`);
  return data;
}

export async function sendCollaborationMessageRequest(groupId: string, payload: {
  message: string;
}) {
  const { data } = await api.post<{
    message: CollaborationMessage;
    presence: CollaborationPresence[];
    onlineCount: number;
  }>(`/collaboration/groups/${groupId}/chat`, payload);
  return data;
}

export async function listCollaborationInvitesRequest() {
  const { data } = await api.get<{ invites: CollaborationInvite[] }>("/collaboration/invites");
  return data.invites;
}

export async function acceptCollaborationInviteRequest(inviteId: string) {
  const { data } = await api.post<{ group: CollaborationGroup | null }>(
    `/collaboration/invites/${inviteId}/accept`
  );
  return data.group;
}

export async function declineCollaborationInviteRequest(inviteId: string) {
  const { data } = await api.post<{ invite: CollaborationInvite }>(
    `/collaboration/invites/${inviteId}/decline`
  );
  return data.invite;
}

export async function createCollaborationScheduleRequest(groupId: string, payload: {
  title: string;
  description?: string;
  notes?: string;
  links?: string[];
  extraInfo?: string;
  category?: string;
}) {
  const { data } = await api.post<{ schedule: Schedule }>(
    `/collaboration/groups/${groupId}/schedules`,
    payload
  );
  return data.schedule;
}

export async function suggestCollaborationScheduleRequest(groupId: string, payload: {
  prompt: string;
  startDate: string;
  timezone?: string;
}) {
  const { data } = await api.post<{ suggestion: ScheduleSuggestion }>(
    `/collaboration/groups/${groupId}/ai/suggest`,
    payload,
    { timeout: 180000 }
  );
  return data.suggestion;
}

export async function createCollaborationScheduleFromSuggestionRequest(
  groupId: string,
  suggestion: ScheduleSuggestion
) {
  const { data } = await api.post<{ schedule: Schedule }>(
    `/collaboration/groups/${groupId}/schedules/from-suggestion`,
    { suggestion }
  );
  return data.schedule;
}

export async function assignCollaborationReminderRequest(
  reminderId: string,
  assignedUserId: string | null
) {
  const { data } = await api.patch<{ reminder: Reminder }>(
    `/collaboration/reminders/${reminderId}/assignee`,
    { assignedUserId }
  );
  return data.reminder;
}

export async function createCollaborationReminderCommentRequest(
  reminderId: string,
  payload: { message: string }
) {
  const { data } = await api.post<{ comment: ReminderComment }>(
    `/collaboration/reminders/${reminderId}/comments`,
    payload
  );
  return data.comment;
}
