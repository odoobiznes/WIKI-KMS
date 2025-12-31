type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  ip?: string
  path?: string
}

class Logger {
  private formatLog(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }
  }

  info(message: string, data?: any) {
    const log = this.formatLog('info', message, data)
    console.log(JSON.stringify(log))
  }

  warn(message: string, data?: any) {
    const log = this.formatLog('warn', message, data)
    console.warn(JSON.stringify(log))
  }

  error(message: string, error?: any, data?: any) {
    const log = this.formatLog('error', message, {
      ...data,
      error: error?.message || error,
      stack: error?.stack,
    })
    console.error(JSON.stringify(log))
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const log = this.formatLog('debug', message, data)
      console.debug(JSON.stringify(log))
    }
  }

  // Request logger middleware
  request(req: any, res: any, next: any) {
    const start = Date.now()
    
    res.on('finish', () => {
      const duration = Date.now() - start
      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.headers['x-forwarded-for'],
        userId: req.userId,
      }
      
      if (res.statusCode >= 400) {
        console.error(JSON.stringify({ ...log, level: 'error' }))
      } else {
        console.log(JSON.stringify({ ...log, level: 'info' }))
      }
    })
    
    next()
  }
}

export const logger = new Logger()

