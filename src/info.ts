import { prettyHrTime } from './pretty-httime';

const chalk = require('chalk');

function leftPad(str: string, len: number, ch = '0'): string {
  len = len - str.length + 1;
  return len > 0 ? new Array(len).join(ch || '0') + str : str;
}

function getTime(){ 
  const date = new Date();
  return chalk.grey([ leftPad(date.getHours().toString(), 1), leftPad(date.getMinutes().toString(), 1), leftPad(date.getSeconds().toString(), 1) ].join(':'));
}

function transformText(task, message){
  message = (message) ? (':' + message) : '';
  return chalk.cyan(task + message);
}

function startAsync(task, message){
  return new Promise((resolve, reject) => {
    const text = transformText(task, message);
    console.log(`[${getTime()}] Starting '${text}'...`);
    resolve(process.hrtime());
  });
}

function doneAsync(task, message, startTime) {
  return new Promise((resolve, reject) => {
    const text = transformText(task, message);
    const endTime = chalk.magenta(prettyHrTime(process.hrtime(startTime)));
    console.log(`[${getTime()}] Finished '${text}' after ${endTime}`);
    resolve();
  });
}

export { startAsync, doneAsync }