import * as chalk from 'chalk';

import {
  CommandData,
  CommandMetadata,
  CommandLineInputs,
  CommandLineOptions,
  formatCommandHelp,
  getListOfCommandDetails,
  Command,
  validators,
  getCommandMetadataList
} from '@ionic/cli-utils';

import { KNOWN_PLUGINS, loadPlugin, resolvePlugin } from '../lib/plugins';

const UNKOWN_COMMAND_ERROR = 'UNKOWN_COMMAND';

@CommandMetadata({
  name: 'help',
  unlisted: true,
  description: 'Provides help for a certain command',
  exampleCommands: ['start'],
  inputs: [
    {
      name: 'command',
      description: 'The command you desire help with',
      validators: [validators.required]
    }
  ]
})
export class HelpCommand extends Command {
  async run(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {

    // If there are no inputs then show global command details.
    if (inputs.length === 0) {
      let allDetails: string[] = [];
      const globalMetadata = getCommandMetadataList(this.env.namespace);
      allDetails = allDetails.concat(getHelpDetails(undefined, globalMetadata, inputs));

      const pluginDetailList: string[][] = await Promise.all(
        KNOWN_PLUGINS.map(pluginName => (
          getPluginDetails(this.env.project.directory, pluginName)
        ))
      );

      return this.env.log.msg(
        `\n${chalk.bold(`Help Details:`)}\n\n` +
        `${allDetails.concat(...pluginDetailList).map(hd => `  ${hd}\n`).join('')}`
      );
    }

    const [, command] = this.env.namespace.locateCommand(inputs);

    // If the command is located on the global namespace then show its help
    if (command) {
      return this.env.log.msg(formatCommandHelp(command.metadata));
    }

    // Resolve the plugin based on the inputs to help
    try {
      const [plugin, argv] = await resolvePlugin(this.env.project.directory, inputs);
      const commandMetadataList = plugin.getAllCommandMetadata();
      const helpDetails = getHelpDetails(plugin.PLUGIN_NAME, commandMetadataList, argv);

      this.env.log.msg(
        `\n${chalk.bold(`Help Details:`)}\n\n` +
        `${helpDetails.map(hd => `  ${hd}\n`).join('')}`
      );

    } catch (e) {
      if (e === UNKOWN_COMMAND_ERROR) {
        return this.env.log.error(`Unable to provide help on unknown command: ${chalk.bold(inputs[0])}`);
      }
      return this.env.log.error(`Unable to find command: ${chalk.bold(inputs[0])}. It is possible that you are trying\n` +
      `to get help on a project based command and you are not in a project directory.`);
    }
  }
};
async function getPluginDetails(projectDirectory: string, pluginName: string): Promise<string[]> {
  try {
    const plugin = await loadPlugin(projectDirectory, pluginName, false);
    const commandMetadataList = plugin.getAllCommandMetadata();
    const helpDetails = getHelpDetails(plugin.PLUGIN_NAME, commandMetadataList, []);

    return helpDetails;
  } catch (e) {
    return [];
  }
}

function getHelpDetails(pluginName: string | undefined, commandMetadataList: CommandData[], argv: string[]): string[] {

  const foundCommandList: CommandData[] = commandMetadataList
    .filter((cmd: CommandData) => cmd.name === argv[0] || argv.length === 0)
    .filter((cmd: CommandData) => !cmd.unlisted)
    .map((cmd: CommandData): CommandData => ({
      ...cmd,
      fullName: (pluginName) ? `${pluginName}:${cmd.name}` : cmd.name
    }));

  // No command was found if the length is zero.
  if (foundCommandList.length === 0) {
    throw UNKOWN_COMMAND_ERROR;
  }

  // Only found one command so show details about that command
  if (foundCommandList.length === 1) {
    return [formatCommandHelp(foundCommandList[0])];
  }

  // We have a list so show the name and description
  return getListOfCommandDetails(foundCommandList);
}