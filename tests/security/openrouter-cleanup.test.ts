import {
  describe,
  expect,
  it,
} from 'vitest'
import fs from 'fs'
import path from 'path'

function getAllFiles(
  directoryPath: string,
  fileList: string[] = []
): string[] {
  if (
    !fs.existsSync(directoryPath)
  ) {
    return fileList
  }

  const files =
    fs.readdirSync(
      directoryPath
    )

  for (const file of files) {
    const absolutePath =
      path.join(
        directoryPath,
        file
      )

    if (
      fs.statSync(
        absolutePath
      ).isDirectory()
    ) {
      getAllFiles(
        absolutePath,
        fileList
      )
    } else if (
      /\.(ts|tsx|js|jsx)$/.test(
        file
      )
    ) {
      fileList.push(
        absolutePath
      )
    }
  }

  return fileList
}

describe(
  'Static Cleanliness: No legacy AI model-selection mechanisms',
  () => {
    const workspaceRoot =
      path.resolve(
        __dirname,
        '../../'
      )

    const appDirectory =
      path.join(
        workspaceRoot,
        'app'
      )

    const libDirectory =
      path.join(
        workspaceRoot,
        'lib'
      )

    const componentsDirectory =
      path.join(
        workspaceRoot,
        'components'
      )

    const activeCodeFiles = [
      ...getAllFiles(
        appDirectory
      ),

      ...getAllFiles(
        libDirectory
      ),

      ...getAllFiles(
        componentsDirectory
      ),
    ]

    it(
      'allows active OpenRouter support but rejects obsolete environment and model-catalog selectors',
      () => {
        /*
         * OPENROUTER_API_KEY and @openrouter/ai-sdk-provider are intentionally
         * allowed because OpenRouter is now a supported runtime provider.
         */
        const forbiddenPatterns = [
          'OPENROUTER_FALLBACK_MODEL_ID',
          'OPENROUTER_MODEL_ID',
          'AI_MODEL_ALIAS',
          'getOwnerConfiguredModelId',
          'MODEL_ALIASES',
          'model-catalog',
        ]

        const violations:
          string[] = []

        for (
          const filePath
          of activeCodeFiles
        ) {
          const content =
            fs.readFileSync(
              filePath,
              'utf-8'
            )

          const relativePath =
            path.relative(
              workspaceRoot,
              filePath
            )

          for (
            const pattern
            of forbiddenPatterns
          ) {
            if (
              content.includes(
                pattern
              )
            ) {
              violations.push(
                `${relativePath}: references forbidden legacy pattern "${pattern}"`
              )
            }
          }
        }

        expect(
          violations,
          `Found obsolete AI provider/model-selection references:\n${violations.join('\n')}`
        ).toEqual([])
      }
    )

    it(
      'keeps the supported OpenRouter integration available',
      () => {
        const combinedSource =
          activeCodeFiles
            .map((filePath) =>
              fs.readFileSync(
                filePath,
                'utf-8'
              )
            )
            .join('\n')

        expect(
          combinedSource
        ).toContain(
          '@openrouter/ai-sdk-provider'
        )

        expect(
          combinedSource
        ).toContain(
          'OPENROUTER_API_KEY'
        )
      }
    )
  }
)