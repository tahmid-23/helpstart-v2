import {
  AutocompleteInteraction,
  ChatInputCommandInteraction
} from 'discord.js';

export interface Command {
  execute(interaction: ChatInputCommandInteraction): void | Promise<void>;
  autocomplete(interaction: AutocompleteInteraction): void | Promise<void>;
}
