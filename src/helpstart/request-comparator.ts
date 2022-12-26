import { Comparator } from '../util/comparator.js';
import { ChestMode, HelpstartRequest } from './helpstart-request.js';

export const REQUEST_COMPARATOR: Comparator<HelpstartRequest> = (a, b) => {
  const playerCountA = a.players.length;
  const playerCountB = b.players.length;

  if (playerCountA !== playerCountB) {
    return playerCountA - playerCountB;
  }

  const chestCountA = a.chests.length;
  const chestCountB = a.chests.length;
  const chestModeA = a.chestMode;
  const chestModeB = b.chestMode;
  if (chestModeA !== chestModeB || chestCountA !== chestCountB) {
    if (chestModeA === ChestMode.NONE || chestCountA === 0) {
      return -1;
    }
    if (chestModeB === ChestMode.NONE || chestCountB === 0) {
      return 1;
    }
  }

  return b.interaction.createdTimestamp - a.interaction.createdTimestamp;
};
