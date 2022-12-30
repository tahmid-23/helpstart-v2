import { APIInteractionGuildMember, GuildMember, User } from 'discord.js';

export function getName(
  user: User,
  member?: GuildMember | APIInteractionGuildMember | null
): string {
  if (member && member instanceof GuildMember) {
    return member.displayName;
  }

  return user.username;
}
