import {
  ActionRowBuilder,
  APIApplicationCommandOptionChoice,
  AutocompleteFocusedOption,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  SlashCommandBuilder,
  SlashCommandStringOption
} from 'discord.js';
import { BotRepository } from '../bot/bot-repository.js';
import { HelpstartDatabase } from '../db/helpstart-database.js';
import { HelpstartExecutor } from '../helpstart/executor/helpstart-executor.js';
import {
  ChestMode,
  getChestModeDisplayName,
  HelpstartRequest
} from '../helpstart/helpstart-request.js';
import { handleBotFail } from '../util/discord/bot-fail.js';
import {
  sendCancelButton,
  sendHelpstartSuccess
} from '../util/discord/helpstart-success.js';
import { getName } from '../util/discord/user.js';
import { USERNAME_REGEX } from '../util/minecraft.js';
import { PriorityQueue } from '../util/priority-queue.js';
import {
  GameChest,
  getChestDisplayName,
  getMapChests
} from '../zombies/game-chest.js';
import {
  GameDifficulty,
  getDifficultyDisplayName
} from '../zombies/game-difficulty.js';
import { GameMap, getMapDisplayName } from '../zombies/game-map.js';
import { Command } from './command.js';

type EnumLike<K extends number | string | symbol, V> = { [key in K]: V };

function getEnumKeys<K extends string, V>(
  enumType: EnumLike<K, V>
): readonly K[] {
  return Object.values(enumType).filter(
    (value) => typeof value === 'string'
  ) as K[];
}

function getEnumChoices<K extends string, V>(
  choiceEnum: EnumLike<K, V>,
  displayNameMapper: (choice: V) => string
): APIApplicationCommandOptionChoice<K>[] {
  return getEnumKeys(choiceEnum).map((map) => {
    return {
      name: displayNameMapper(choiceEnum[map]),
      value: map
    };
  });
}

const mapOption = (option: SlashCommandStringOption) => {
  return option
    .setName('map')
    .setDescription('The map to queue')
    .setRequired(true)
    .addChoices(...getEnumChoices(GameMap, getMapDisplayName));
};

const playersOption = (option: SlashCommandStringOption) => {
  return option
    .setName('players')
    .setDescription(`Adds players`)
    .setMinLength(2)
    .setMaxLength(50)
    .setAutocomplete(true)
    .setRequired(true);
};

const difficultyOption = (option: SlashCommandStringOption) => {
  return option
    .setName('difficulty')
    .setDescription("The game's difficulty")
    .addChoices(...getEnumChoices(GameDifficulty, getDifficultyDisplayName));
};

const chestModeOption = (option: SlashCommandStringOption) => {
  return option
    .setName('chest-mode')
    .setDescription('Sets the chest mode')
    .addChoices(...getEnumChoices(ChestMode, getChestModeDisplayName));
};

const chestsOption = (
  option: SlashCommandStringOption,
  chestNumber: number
) => {
  return option
    .setName(`chest-${chestNumber}`)
    .setDescription(`Adds chests`)
    .setAutocomplete(true);
};

export class HelpstartCommand implements Command {
  static readonly data = new SlashCommandBuilder()
    .setName('helpstart')
    .setDescription('Queues a helpstart request')
    .addStringOption(mapOption)
    .addStringOption(playersOption)
    .addStringOption(difficultyOption)
    .addStringOption(chestModeOption)
    .addStringOption((option) => chestsOption(option, 1))
    .addStringOption((option) => chestsOption(option, 2))
    .addStringOption((option) => chestsOption(option, 3))
    .addStringOption((option) => chestsOption(option, 4))
    .addStringOption((option) => chestsOption(option, 5));

  private readonly requests: PriorityQueue<HelpstartRequest>;

  private readonly helpstartExecutor: HelpstartExecutor;

  private readonly botRepository: BotRepository;

  private readonly lastRequests: Record<string, HelpstartRequest>;

  private readonly helpstartDatabase: HelpstartDatabase;

  constructor(
    requests: PriorityQueue<HelpstartRequest>,
    helpstartExecutor: HelpstartExecutor,
    botRepository: BotRepository,
    lastRequests: Record<string, HelpstartRequest>,
    helpstartDatabase: HelpstartDatabase
  ) {
    this.requests = requests;
    this.helpstartExecutor = helpstartExecutor;
    this.botRepository = botRepository;
    this.lastRequests = lastRequests;
    this.helpstartDatabase = helpstartDatabase;
  }

  private parseMapRequired(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | AutocompleteInteraction<CacheType>
  ): GameMap {
    return GameMap[
      interaction.options.getString('map', true) as keyof typeof GameMap
    ];
  }

  private parseMap(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | AutocompleteInteraction<CacheType>
  ): GameMap | undefined {
    const mapName = interaction.options.getString('map');
    if (mapName) {
      return GameMap[mapName as keyof typeof GameMap];
    }

    return undefined;
  }

  private parseDifficulty(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | AutocompleteInteraction<CacheType>
  ): GameDifficulty {
    const difficultyName = interaction.options.getString('difficulty');
    if (difficultyName !== null) {
      return GameDifficulty[difficultyName as keyof typeof GameDifficulty];
    }

    return GameDifficulty.NORMAL;
  }

  private async parsePlayers(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<readonly string[] | undefined> {
    const players = [];

    const playerInput = interaction.options
      .getString('players', true)
      .replace(/\s\s+/g, ' ');
    const playerStrings = playerInput
      .split(' ')
      .map((name) => name.toLowerCase());
    const uniqueCount = playerStrings.filter(
      (player, index, arr) => arr.lastIndexOf(player) === index
    ).length;
    if (playerStrings.length !== uniqueCount) {
      await interaction.reply({
        content: 'All player names must be unique.',
        ephemeral: true
      });

      return undefined;
    }
    if (playerStrings.length === 0) {
      await interaction.reply({
        content: 'At least one player must be in the game.',
        ephemeral: true
      });

      return undefined;
    }
    if (playerStrings.length > 3) {
      await interaction.reply({
        content: 'Only up to 3 players can be in the game.',
        ephemeral: true
      });

      return undefined;
    }

    const invalidPlayers = [];
    const botNames = Object.values(this.botRepository.online).map((bot) =>
      bot.username.toLowerCase()
    );
    const botPlayers = [];
    for (const player of playerStrings) {
      if (!USERNAME_REGEX.test(player)) {
        invalidPlayers.push(player);
      } else if (botNames.includes(player)) {
        botPlayers.push(player);
      } else {
        players.push(player);
      }
    }
    if (invalidPlayers.length !== 0) {
      await interaction.reply({
        content: `Player names "${invalidPlayers.join(', ')}" are invalid.`,
        ephemeral: true
      });
      return undefined;
    }
    if (botPlayers.length !== 0) {
      await handleBotFail(interaction, botPlayers);
      return undefined;
    }

    for (const player of players) {
      if (await this.helpstartDatabase.isBannedUsername(player)) {
        await interaction.reply({
          content: `Please don't abuse the bot.`,
          ephemeral: true
        });
        return undefined;
      }
    }

    return players;
  }

  private parseChestMode(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | AutocompleteInteraction<CacheType>
  ): ChestMode | undefined {
    const chestModeName = interaction.options.getString('chest-mode');
    if (chestModeName) {
      return ChestMode[chestModeName as keyof typeof ChestMode];
    }

    return undefined;
  }

  private async parseChests(
    interaction: ChatInputCommandInteraction<CacheType>,
    map: GameMap,
    chestMode: ChestMode | undefined
  ): Promise<[ChestMode, readonly GameChest[]] | undefined> {
    const chests: GameChest[] = [];
    const mapChests = getMapChests(map);
    const keyToChest: Record<string, GameChest> = {};
    for (const chest of mapChests) {
      keyToChest[GameChest[chest].toLowerCase()] = chest;
    }

    const invalidChests = [];
    for (let i = 1; i <= 5; ++i) {
      const chestInput = interaction.options.getString(`chest-${i}`);
      if (!chestInput) {
        continue;
      }

      const chest = keyToChest[chestInput.toLowerCase()];
      if (chest === undefined) {
        invalidChests.push(chestInput);
        continue;
      }

      chests.push(chest);
    }

    if (invalidChests.length !== 0) {
      await interaction.reply({
        content: `Chests "${invalidChests.join(
          ', '
        )}" are invalid for ${getMapDisplayName(map)}.`,
        ephemeral: true
      });
      return undefined;
    }

    if (
      chestMode === ChestMode.BLACKLIST &&
      chests.length === mapChests.length
    ) {
      await interaction.reply({
        content: `You must allow at least one chest if you are in Bad Chests mode.`,
        ephemeral: true
      });
      return undefined;
    }

    if (chestMode === ChestMode.WHITELIST && chests.length === 0) {
      await interaction.reply({
        content: `You must specify at least one chest if you are in Good Chests mode.`,
        ephemeral: true
      });
      return undefined;
    }

    if (chestMode === undefined) {
      if (chests.length === 0) {
        if (map === GameMap.DE) {
          chests.push(GameChest.GALLERY);
          chestMode = ChestMode.BLACKLIST;
        } else {
          chestMode = ChestMode.NONE;
        }
      } else {
        chestMode = ChestMode.WHITELIST;
      }
    }

    return [chestMode, chests];
  }

  async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<void> {
    for (const request of this.requests) {
      if (request.interaction.user.id === interaction.user.id) {
        await interaction.reply({
          content: 'You can only make one request at a time.',
          ephemeral: true
        });
        return;
      }
    }

    for (const execution of this.helpstartExecutor.getExecutions()) {
      if (
        execution.session.request.interaction.user.id === interaction.user.id
      ) {
        await interaction.reply({
          content: 'You can only make one request at a time.',
          ephemeral: true
        });
        return;
      }
    }

    const map = this.parseMapRequired(interaction);
    const difficulty = this.parseDifficulty(interaction);
    if (map === GameMap.AA && difficulty !== GameDifficulty.NORMAL) {
      await interaction.reply({
        content: `Difficulty ${GameDifficulty[difficulty]} is not valid for Alien Arcadium.`,
        ephemeral: true
      });
      return;
    }
    const players = await this.parsePlayers(interaction);
    if (!players) {
      return;
    }
    const initialChestMode = this.parseChestMode(interaction);
    const chestsResult = await this.parseChests(
      interaction,
      map,
      initialChestMode
    );
    if (!chestsResult) {
      return;
    }
    const [chestMode, chests] = chestsResult;

    const cancelButton = new ButtonBuilder()
      .setCustomId('helpstart-cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger);
    const response = await sendHelpstartSuccess(interaction, cancelButton);
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button
    });

    const onComplete = () => {
      interaction.editReply({
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            ButtonBuilder.from(cancelButton).setDisabled(true)
          )
        ]
      });
    };
    const request: HelpstartRequest = {
      interaction: interaction,
      onComplete: onComplete,
      map: map,
      difficulty: difficulty,
      players: players,
      chestMode: chestMode,
      chests: chests
    };
    this.requests.push(request);
    this.lastRequests[interaction.user.id] = request;

    await sendCancelButton(
      collector,
      interaction,
      this.requests,
      this.helpstartExecutor
    );
  }

  async autocompletePlayers(
    interaction: AutocompleteInteraction<CacheType>,
    focused: AutocompleteFocusedOption
  ) {
    if (focused.value.length !== 0) {
      await interaction.respond([]);
      return;
    }

    const queryPromise = this.helpstartDatabase.queryUserAccounts(
      interaction.user.id
    );
    queryPromise.catch(console.error);
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(reject, 2500); // a little under Discord's 3 second limit
    });

    await Promise.race([queryPromise, timeoutPromise]).then(async (igns) => {
      if (igns.length !== 0) {
        await interaction.respond(
          igns.map((ign) => ({
            name: ign,
            value: ign
          }))
        );
        return;
      }

      const senderName = getName(interaction.user, interaction.member);
      if (!USERNAME_REGEX.test(senderName)) {
        await interaction.respond([]);
        return;
      }

      await interaction.respond([
        {
          name: senderName,
          value: senderName
        }
      ]);
    });
  }

  async autocompleteChests(
    interaction: AutocompleteInteraction<CacheType>
  ): Promise<void> {
    const map = this.parseMap(interaction);
    const mapChests = getMapChests(map);

    await interaction.respond(
      mapChests.map((chest) => ({
        name: getChestDisplayName(chest),
        value: GameChest[chest]
      }))
    );
  }

  async autocomplete(
    interaction: AutocompleteInteraction<CacheType>
  ): Promise<void> {
    const focused = interaction.options.getFocused(true);
    switch (focused.name) {
      case 'players': {
        await this.autocompletePlayers(interaction, focused);
        break;
      }
      case 'chest-1':
      case 'chest-2':
      case 'chest-3':
      case 'chest-4':
      case 'chest-5': {
        await this.autocompleteChests(interaction);
        break;
      }
    }
  }
}
