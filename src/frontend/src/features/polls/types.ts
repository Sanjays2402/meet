export const POLL_TOPIC = 'poll'
export const MAX_POLL_OPTIONS = 6
export const MIN_POLL_OPTIONS = 2

export type Poll = {
  id: string
  question: string
  options: string[]
  creatorIdentity: string
  creatorName: string
  closed: boolean
  // voter identity -> option index
  votes: Record<string, number>
}

export type PollMessage =
  | { type: 'create'; poll: Omit<Poll, 'votes' | 'closed'> }
  | { type: 'vote'; pollId: string; option: number }
  | { type: 'close'; pollId: string }
