import { exec } from "child_process"

const LOG_PREFIX = "[snowflake-cli]"

function sfLog(message: string): void {
  if (process.env.SNOWFLAKE_SDK_QUIET === "1") return
  console.log(`${LOG_PREFIX} ${message}`)
}

function previewSql(sql: string, maxLen = 200): string {
  const s = sql.replace(/\s+/g, " ").trim()
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`
}

function runSnowSql(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, {
      encoding: "utf-8",
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env },
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message))
      } else {
        resolve(stdout)
      }
    })
  })
}

export async function querySnowflake(
  sql: string,
  options?: { binds?: (string | number | null | undefined)[]; warehouse?: string; callersRights?: boolean },
): Promise<Record<string, unknown>[]> {
  let finalSql = sql
  if (options?.binds && options.binds.length > 0) {
    let idx = 0
    finalSql = sql.replace(/\?/g, () => {
      const val = options.binds![idx++]
      if (val === null || val === undefined) return "NULL"
      if (typeof val === "number") return String(val)
      return `'${String(val).replace(/'/g, "''")}'`
    })
  }

  const fullSql = `USE WAREHOUSE team_f_wh; ${finalSql}`
  const t0 = Date.now()
  sfLog(`query start sql=${JSON.stringify(previewSql(fullSql))}`)

  try {
    const escaped = fullSql.replace(/"/g, '\\"')
    const result = await runSnowSql(
      `snow sql -q "${escaped}" --connection dev --format json`
    )

    const ms = Date.now() - t0
    let parsed = JSON.parse(result)
    if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
      parsed = parsed[parsed.length - 1]
    }
    sfLog(`query ok rows=${parsed.length} afterMs=${ms}`)
    return parsed as Record<string, unknown>[]
  } catch (e) {
    const ms = Date.now() - t0
    const msg = e instanceof Error ? e.message : String(e)
    sfLog(`query error afterMs=${ms}: ${msg}`)
    throw new Error(`Query failed: ${msg}`)
  }
}

export async function querySnowflakeLongRunning(
  sql: string,
  options?: { callersRights?: boolean; pollIntervalMs?: number; statusLogIntervalMs?: number; maxWaitMs?: number },
): Promise<Record<string, unknown>[]> {
  return querySnowflake(sql, options)
}
