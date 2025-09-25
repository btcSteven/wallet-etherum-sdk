type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogStyle {
  background: string;
  color: string;
  padding: string;
  borderRadius: string;
}

const styles: Record<LogLevel, LogStyle> = {
  info: {
    background: '#2196F3',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  warn: {
    background: '#FFC107',
    color: 'black',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  error: {
    background: '#F44336',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  debug: {
    background: '#4CAF50',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
  },
};

export class Logger {
  private static formatStyle(style: LogStyle): string {
    return Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  private static log(level: LogLevel, label: string, ...args: any[]) {
    const style = styles[level];
    console.log(
      `%c${label}%c %s`,
      this.formatStyle(style),
      '',
      ...args
    );
  }

  static info(label: string, ...args: any[]) {
    this.log('info', label, ...args);
  }

  static warn(label: string, ...args: any[]) {
    this.log('warn', label, ...args);
  }

  static error(label: string, ...args: any[]) {
    this.log('error', label, ...args);
  }

  static debug(label: string, ...args: any[]) {
    this.log('debug', label, ...args);
  }

  static table(...args: any[]) {
    console.table(...args);
  }

  static group(...args: any[]) {
    console.group(...args);
  }

  static groupEnd() {
    console.groupEnd();
  }

  static time(label: string) {
    console.time(label);
  }

  static timeEnd(label: string) {
    console.timeEnd(label);
  }

  static clear() {
    console.clear();
  }
} 