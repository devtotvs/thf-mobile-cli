import * as chalk from 'chalk';

import { CommandData, CommandOption } from '../../definitions';
import { STRIP_ANSI_REGEX } from './format';

/**
 *
 */
export function formatCommandHelp(cmdMetadata: CommandData): string {
  let description = cmdMetadata.description.split('\n').join('\n  ');

  return `
  ${chalk.bold(description)}
  ${formatUsage(cmdMetadata)}${cmdMetadata.options ? formatOptions(cmdMetadata.options) : ''}${formatExamples(cmdMetadata)}
  `;
}

function formatUsage({ name, inputs }: CommandData): string {
  const headerLine = chalk.bold(`Usage`);
  const usageLine =
      `$ ionic ${name} ${
        (inputs || []).map(command => '<' + command.name + '>').join(' ')}`;

  return `
    ${headerLine}
      ${usageLine}
  `;
}

function formatOptions(options: CommandOption[]): string {
  if (!Array.isArray(options) || options.length === 0) {
    return '';
  }

  const headerLine = chalk.bold(`Options`);

  function optionLineFn({ name, aliases, description}: CommandOption) {
    const optionList = chalk.green(`--${name}`) +
      (aliases && aliases.length > 0 ? ', ' +
       aliases
         .map((alias) => chalk.green(`-${alias}`))
         .join(', ') : '');

    const optionListLength = optionList.replace(STRIP_ANSI_REGEX, '').length;
    const fullLength = optionListLength > 25 ? optionListLength + 1 : 25;

    return `${optionList} ${Array(fullLength - optionListLength).join('.')} ${description}`;
  };

  return `
    ${headerLine}
      ${options.map(optionLineFn).join(`
      `)}
  `;
}

function formatExamples({ name, exampleCommands }: CommandData): string {
  if (!Array.isArray(exampleCommands)) {
    return '';
  }

  const headerLine = chalk.bold(`Examples`);
  const exampleLines = exampleCommands.map(cmd => `$ ionic ${name} ${cmd} `);

  return `
    ${headerLine}
      ${exampleLines.join(`
      `)}
  `;
}
